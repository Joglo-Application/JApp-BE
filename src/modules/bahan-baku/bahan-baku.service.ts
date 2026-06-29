import { count, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/config/database';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { NotFoundError } from '@/shared/errors';
import { getPaginationParams, type PaginationQuery } from '@/shared/pagination';
import type { CreateBahanBakuInput, UpdateBahanBakuInput } from './bahan-baku.schema';

export async function listBahanBaku(query: PaginationQuery) {
  const { limit, offset, page } = getPaginationParams(query);
  const whereClause = query.q ? ilike(bahanBaku.namaBahan, `%${query.q}%`) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(bahanBaku)
      .where(whereClause)
      .orderBy(desc(bahanBaku.bahanId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(bahanBaku).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getBahanBakuById(id: number) {
  const [row] = await db.select().from(bahanBaku).where(eq(bahanBaku.bahanId, id)).limit(1);
  if (!row) throw new NotFoundError('Bahan baku tidak ditemukan');
  return row;
}

export async function createBahanBaku(input: CreateBahanBakuInput) {
  const [created] = await db.insert(bahanBaku).values(input).returning();
  return created;
}

export async function updateBahanBaku(id: number, input: UpdateBahanBakuInput) {
  await getBahanBakuById(id);
  const [updated] = await db
    .update(bahanBaku)
    .set(input)
    .where(eq(bahanBaku.bahanId, id))
    .returning();
  return updated;
}

/**
 * Menambah stok bahan baku secara atomik (`stok = stok + jumlah`).
 * Dipakai halaman "Tambah Stok Gudang" yang hanya mengisi produk + jumlah
 * (tanpa supplier/harga). Untuk penerimaan barang lengkap pakai POST /transaksi-masuk.
 */
export async function tambahStokBahanBaku(id: number, jumlah: string) {
  await getBahanBakuById(id);
  const [updated] = await db
    .update(bahanBaku)
    .set({ stok: sql`${bahanBaku.stok} + ${jumlah}` })
    .where(eq(bahanBaku.bahanId, id))
    .returning();
  return updated;
}

export async function deleteBahanBaku(id: number) {
  await getBahanBakuById(id);
  await db.delete(bahanBaku).where(eq(bahanBaku.bahanId, id));
}
