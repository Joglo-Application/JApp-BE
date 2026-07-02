import { and, count, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/config/database';
import { menus } from '@/db/schema/menus';
import { resepMenu } from '@/db/schema/resep-menu';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams, type PaginationQuery } from '@/shared/pagination';
import type {
  CreateMenuInput,
  CreateResepInput,
  UpdateMenuInput,
  UpdateResepInput,
} from './menus.schema';

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

export async function createMenu(input: CreateMenuInput) {
  const { resep, ...menuData } = input;

  return db.transaction(async (tx) => {
    const [created] = await tx.insert(menus).values(menuData).returning();

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
      [updated] = await tx
        .update(menus)
        .set(menuData)
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
