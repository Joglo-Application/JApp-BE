import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { resepMenu } from '@/db/schema/resep-menu';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { transaksiBahanKeluar } from '@/db/schema/transaksi-bahan-keluar';
import { pembayaran } from '@/db/schema/pembayaran';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type { CreatePesananInput, ListPesananQuery } from './pesanan.schema';

/** Pembulatan numeric ke skala 3 desimal sesuai kolom DB. */
function toQty(value: number): string {
  return value.toFixed(3);
}

/**
 * Membuat pesanan baru sekaligus:
 * - menghitung total dari harga menu (server-side, tidak percaya input client),
 * - memotong stok bahan baku berdasarkan resep menu,
 * - mencatat transaksi bahan keluar (tipe `sale`).
 * Seluruhnya dalam satu transaksi DB agar atomik.
 */
export async function createPesanan(userId: number, input: CreatePesananInput) {
  const newId = await db.transaction(async (tx) => {
    const menuIds = [...new Set(input.items.map((i) => i.menuId))];

    // 1. Validasi menu
    const menuRows = await tx.select().from(menus).where(inArray(menus.menuId, menuIds));
    const menuMap = new Map(menuRows.map((m) => [m.menuId, m]));

    for (const item of input.items) {
      const menu = menuMap.get(item.menuId);
      if (!menu) throw new NotFoundError(`Menu id ${item.menuId} tidak ditemukan`);
      if (!menu.isActive) {
        throw new BadRequestError(`Menu "${menu.namaMenu}" sedang tidak aktif`);
      }
    }

    // 2. Agregasi kebutuhan bahan baku dari resep menu
    const reseps = menuIds.length
      ? await tx.select().from(resepMenu).where(inArray(resepMenu.menuId, menuIds))
      : [];
    const resepByMenu = new Map<number, typeof reseps>();
    for (const r of reseps) {
      const arr = resepByMenu.get(r.menuId) ?? [];
      arr.push(r);
      resepByMenu.set(r.menuId, arr);
    }

    const required = new Map<number, number>(); // bahanId -> total kebutuhan
    for (const item of input.items) {
      for (const r of resepByMenu.get(item.menuId) ?? []) {
        const need = Number(r.jumlahPakai) * item.jumlah;
        required.set(r.bahanId, (required.get(r.bahanId) ?? 0) + need);
      }
    }

    // 3. Cek ketersediaan & potong stok
    if (required.size > 0) {
      const bahanIds = [...required.keys()];
      const bahanRows = await tx
        .select()
        .from(bahanBaku)
        .where(inArray(bahanBaku.bahanId, bahanIds));
      const bahanMap = new Map(bahanRows.map((b) => [b.bahanId, b]));

      for (const [bahanId, need] of required) {
        const bahan = bahanMap.get(bahanId);
        if (!bahan) throw new NotFoundError(`Bahan baku id ${bahanId} tidak ditemukan`);
        const current = Number(bahan.stok);
        if (current < need) {
          throw new ConflictError(
            `Stok "${bahan.namaBahan}" tidak mencukupi (tersedia ${current}, butuh ${need})`,
          );
        }
      }

      for (const [bahanId, need] of required) {
        const bahan = bahanMap.get(bahanId)!;
        await tx
          .update(bahanBaku)
          .set({ stok: toQty(Number(bahan.stok) - need) })
          .where(eq(bahanBaku.bahanId, bahanId));
      }
    }

    // 4. Hitung total & simpan pesanan + detail
    let total = 0;
    const detailValues = input.items.map((item) => {
      const menu = menuMap.get(item.menuId)!;
      const subtotal = menu.harga * item.jumlah;
      total += subtotal;
      return {
        menuId: item.menuId,
        jumlah: item.jumlah,
        hargaSatuan: menu.harga,
        subtotal,
      };
    });

    const [created] = await tx
      .insert(pesanan)
      .values({ userId, total, status: 'pending' })
      .returning();

    await tx
      .insert(detailPesanan)
      .values(detailValues.map((d) => ({ ...d, pesananId: created.pesananId })));

    // 5. Catat transaksi bahan keluar (penjualan)
    if (required.size > 0) {
      await tx.insert(transaksiBahanKeluar).values(
        [...required].map(([bahanId, need]) => ({
          bahanId,
          jumlah: toQty(need),
          tipeKeluar: 'sale' as const,
          keterangan: `Penjualan pesanan #${created.pesananId}`,
          pesananId: created.pesananId,
          userId,
        })),
      );
    }

    return created.pesananId;
  });

  return getPesananById(newId);
}

export async function listPesanan(query: ListPesananQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = query.status ? eq(pesanan.status, query.status) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(pesanan)
      .where(whereClause)
      .orderBy(desc(pesanan.pesananId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(pesanan).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getPesananById(id: number) {
  const [row] = await db.select().from(pesanan).where(eq(pesanan.pesananId, id)).limit(1);
  if (!row) throw new NotFoundError('Pesanan tidak ditemukan');

  const items = await db
    .select({
      detailId: detailPesanan.detailId,
      menuId: menus.menuId,
      namaMenu: menus.namaMenu,
      jumlah: detailPesanan.jumlah,
      hargaSatuan: detailPesanan.hargaSatuan,
      subtotal: detailPesanan.subtotal,
    })
    .from(detailPesanan)
    .innerJoin(menus, eq(detailPesanan.menuId, menus.menuId))
    .where(eq(detailPesanan.pesananId, id));

  const [bayar] = await db
    .select()
    .from(pembayaran)
    .where(eq(pembayaran.pesananId, id))
    .limit(1);

  return { ...row, items, pembayaran: bayar ?? null };
}

/**
 * Membatalkan pesanan yang masih `pending` dan mengembalikan stok bahan baku
 * yang sebelumnya dipotong. Pengembalian dicatat sebagai transaksi keluar
 * bertipe `adjustment` dengan jumlah negatif (reversal).
 */
export async function cancelPesanan(userId: number, id: number) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(pesanan).where(eq(pesanan.pesananId, id)).limit(1);
    if (!row) throw new NotFoundError('Pesanan tidak ditemukan');
    if (row.status !== 'pending') {
      throw new ConflictError(
        `Pesanan dengan status "${row.status}" tidak dapat dibatalkan`,
      );
    }

    const saleLogs = await tx
      .select()
      .from(transaksiBahanKeluar)
      .where(
        and(
          eq(transaksiBahanKeluar.pesananId, id),
          eq(transaksiBahanKeluar.tipeKeluar, 'sale'),
        ),
      );

    for (const log of saleLogs) {
      const [bahan] = await tx
        .select()
        .from(bahanBaku)
        .where(eq(bahanBaku.bahanId, log.bahanId))
        .limit(1);
      if (bahan) {
        await tx
          .update(bahanBaku)
          .set({ stok: toQty(Number(bahan.stok) + Number(log.jumlah)) })
          .where(eq(bahanBaku.bahanId, log.bahanId));
      }
      await tx.insert(transaksiBahanKeluar).values({
        bahanId: log.bahanId,
        jumlah: toQty(-Number(log.jumlah)),
        tipeKeluar: 'adjustment',
        keterangan: `Pembatalan pesanan #${id} (pengembalian stok)`,
        pesananId: id,
        userId,
      });
    }

    const [updated] = await tx
      .update(pesanan)
      .set({ status: 'cancelled' })
      .where(eq(pesanan.pesananId, id))
      .returning();

    return updated;
  });
}
