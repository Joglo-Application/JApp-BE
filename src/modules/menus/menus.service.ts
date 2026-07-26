import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { menus } from '@/db/schema/menus';
import { resepMenu } from '@/db/schema/resep-menu';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { kategori } from '@/db/schema/kategori';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams, type PaginationQuery } from '@/shared/pagination';
import type {
  CreateMenuInput,
  CreateResepInput,
  UpdateMenuInput,
  UpdateResepInput,
} from './menus.schema';

/** Kolom stok bertipe numeric(12,3) → butuh string dengan 3 desimal. */
function toQty(value: number): string {
  return value.toFixed(3);
}

export async function listMenus(query: PaginationQuery) {
  const { limit, offset, page } = getPaginationParams(query);
  const whereClause = query.q ? ilike(menus.namaMenu, `%${query.q}%`) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(menus)
      .where(whereClause)
      .orderBy(desc(menus.menuId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(menus).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getMenuById(id: number) {
  const [menu] = await db.select().from(menus).where(eq(menus.menuId, id)).limit(1);
  if (!menu) throw new NotFoundError('Menu tidak ditemukan');

  const resep = await db
    .select({
      resepId: resepMenu.resepId,
      bahanId: bahanBaku.bahanId,
      namaBahan: bahanBaku.namaBahan,
      satuan: bahanBaku.satuan,
      jumlahPakai: resepMenu.jumlahPakai,
    })
    .from(resepMenu)
    .innerJoin(bahanBaku, eq(resepMenu.bahanId, bahanBaku.bahanId))
    .where(eq(resepMenu.menuId, id));

  return { ...menu, resep };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Menjaga `menus.kategori` (nama untuk ditampilkan) dan `menus.kategoriId`
 * (acuan ke tabel master) tetap sepakat, dari arah mana pun datanya dikirim.
 *
 * Frontend saat ini masih mengirim nama kategori sebagai teks bebas, jadi nama
 * yang belum terdaftar akan otomatis dibuatkan barisnya di master — kalau
 * tidak, menu lama tidak akan bisa disimpan lagi.
 */
async function selaraskanKategori<T extends { kategori?: string; kategoriId?: number }>(
  tx: Tx,
  data: T,
): Promise<T> {
  if (data.kategoriId !== undefined) {
    const [row] = await tx
      .select({ nama: kategori.nama })
      .from(kategori)
      .where(eq(kategori.kategoriId, data.kategoriId))
      .limit(1);
    if (!row) throw new NotFoundError('Kategori tidak ditemukan');
    return { ...data, kategori: row.nama };
  }

  if (data.kategori !== undefined) {
    const [ada] = await tx
      .select({ id: kategori.kategoriId })
      .from(kategori)
      .where(and(eq(kategori.jenis, 'menu'), eq(kategori.nama, data.kategori)))
      .limit(1);
    if (ada) return { ...data, kategoriId: ada.id };

    const [dibuat] = await tx
      .insert(kategori)
      .values({ jenis: 'menu', nama: data.kategori })
      .returning({ id: kategori.kategoriId });
    return { ...data, kategoriId: dibuat.id };
  }

  return data;
}

export async function createMenu(input: CreateMenuInput) {
  const { resep, ...menuData } = input;

  return db.transaction(async (tx) => {
    const nilai = await selaraskanKategori(tx, menuData);
    const [created] = await tx.insert(menus).values(nilai).returning();

    if (resep && resep.length > 0) {
      // Dedupe by bahanId (resep_menu has a unique (menu_id, bahan_id) index).
      const uniqueResep = Array.from(new Map(resep.map((r) => [r.bahanId, r])).values());
      await tx.insert(resepMenu).values(
        uniqueResep.map((r) => ({
          menuId: created.menuId,
          bahanId: r.bahanId,
          // Coerce to string — the handler reads raw JSON (no zod transform),
          // and the numeric column expects a string.
          jumlahPakai: String(r.jumlahPakai),
        })),
      );

      // Saat produk disimpan, potong Stok Gudang sekali sebesar jumlah pakai
      // tiap bahan di resep: stok_gudang_baru = stok_gudang - jumlahPakai
      // (mengikuti rumus: qty stok - jumlah dipakai = qty stok gudang).
      const konsumsi = new Map<number, number>();
      for (const r of uniqueResep) {
        konsumsi.set(r.bahanId, Number(r.jumlahPakai));
      }
      const bahanIds = [...konsumsi.keys()];
      const bahanRows = await tx
        .select()
        .from(bahanBaku)
        .where(inArray(bahanBaku.bahanId, bahanIds));
      const bahanMap = new Map(bahanRows.map((b) => [b.bahanId, b]));

      // Validasi ketersediaan dulu, baru potong (agar transaksi rollback dan
      // stok tidak jadi negatif bila salah satu bahan tidak cukup).
      for (const [bahanId, need] of konsumsi) {
        const bahan = bahanMap.get(bahanId);
        if (!bahan) throw new NotFoundError(`Bahan baku id ${bahanId} tidak ditemukan`);
        if (Number(bahan.stok) < need) {
          throw new ConflictError(
            `Stok "${bahan.namaBahan}" tidak mencukupi ` +
              `(tersedia ${Number(bahan.stok)}, butuh ${need})`,
          );
        }
      }
      for (const [bahanId, need] of konsumsi) {
        const bahan = bahanMap.get(bahanId)!;
        await tx
          .update(bahanBaku)
          .set({ stok: toQty(Number(bahan.stok) - need) })
          .where(eq(bahanBaku.bahanId, bahanId));
      }
    }

    return created;
  });
}

export async function updateMenu(id: number, input: UpdateMenuInput) {
  // `resep` bukan kolom tabel menus — pisahkan agar tidak masuk ke .set().
  const { resep, ...menuData } = input;

  return db.transaction(async (tx) => {
    const [menu] = await tx.select().from(menus).where(eq(menus.menuId, id)).limit(1);
    if (!menu) throw new NotFoundError('Menu tidak ditemukan');

    let updated = menu;
    if (Object.keys(menuData).length > 0) {
      const nilai = await selaraskanKategori(tx, menuData);
      [updated] = await tx
        .update(menus)
        .set(nilai)
        .where(eq(menus.menuId, id))
        .returning();
    }

    // Bila resep dikirim, ganti total (replace) isi resep_menu menu ini.
    if (resep) {
      await tx.delete(resepMenu).where(eq(resepMenu.menuId, id));
      if (resep.length > 0) {
        // Dedupe by bahanId (unique index menu_id + bahan_id).
        const uniqueResep = Array.from(new Map(resep.map((r) => [r.bahanId, r])).values());
        await tx.insert(resepMenu).values(
          uniqueResep.map((r) => ({
            menuId: id,
            bahanId: r.bahanId,
            jumlahPakai: String(r.jumlahPakai),
          })),
        );
      }
    }

    return updated;
  });
}

export async function deleteMenu(id: number) {
  const [menu] = await db.select().from(menus).where(eq(menus.menuId, id)).limit(1);
  if (!menu) throw new NotFoundError('Menu tidak ditemukan');
  await db.delete(menus).where(eq(menus.menuId, id));
}

// Resep sub-resource

export async function listResep(menuId: number) {
  const [menu] = await db.select().from(menus).where(eq(menus.menuId, menuId)).limit(1);
  if (!menu) throw new NotFoundError('Menu tidak ditemukan');

  return db
    .select({
      resepId: resepMenu.resepId,
      menuId: resepMenu.menuId,
      bahanId: bahanBaku.bahanId,
      namaBahan: bahanBaku.namaBahan,
      satuan: bahanBaku.satuan,
      jumlahPakai: resepMenu.jumlahPakai,
    })
    .from(resepMenu)
    .innerJoin(bahanBaku, eq(resepMenu.bahanId, bahanBaku.bahanId))
    .where(eq(resepMenu.menuId, menuId));
}

export async function addResep(menuId: number, input: CreateResepInput) {
  const [menu] = await db.select().from(menus).where(eq(menus.menuId, menuId)).limit(1);
  if (!menu) throw new NotFoundError('Menu tidak ditemukan');

  const [bahan] = await db
    .select()
    .from(bahanBaku)
    .where(eq(bahanBaku.bahanId, input.bahanId))
    .limit(1);
  if (!bahan) throw new NotFoundError('Bahan baku tidak ditemukan');

  const [existing] = await db
    .select({ resepId: resepMenu.resepId })
    .from(resepMenu)
    .where(and(eq(resepMenu.menuId, menuId), eq(resepMenu.bahanId, input.bahanId)))
    .limit(1);
  if (existing) {
    throw new ConflictError('Bahan ini sudah ada di resep menu');
  }

  const [created] = await db
    .insert(resepMenu)
    .values({ menuId, bahanId: input.bahanId, jumlahPakai: input.jumlahPakai })
    .returning();
  return created;
}

export async function updateResep(menuId: number, resepId: number, input: UpdateResepInput) {
  const [existing] = await db
    .select()
    .from(resepMenu)
    .where(and(eq(resepMenu.resepId, resepId), eq(resepMenu.menuId, menuId)))
    .limit(1);
  if (!existing) throw new NotFoundError('Resep tidak ditemukan');

  const [updated] = await db
    .update(resepMenu)
    .set({ jumlahPakai: input.jumlahPakai })
    .where(eq(resepMenu.resepId, resepId))
    .returning();
  return updated;
}

export async function deleteResep(menuId: number, resepId: number) {
  const [existing] = await db
    .select()
    .from(resepMenu)
    .where(and(eq(resepMenu.resepId, resepId), eq(resepMenu.menuId, menuId)))
    .limit(1);
  if (!existing) throw new NotFoundError('Resep tidak ditemukan');

  await db.delete(resepMenu).where(eq(resepMenu.resepId, resepId));
}
