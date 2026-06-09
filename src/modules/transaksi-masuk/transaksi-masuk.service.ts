import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { transaksiBahanMasuk } from '@/db/schema/transaksi-bahan-masuk';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { suppliers } from '@/db/schema/suppliers';
import { NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type {
  CreateTransaksiMasukInput,
  ListTransaksiMasukQuery,
} from './transaksi-masuk.schema';

function toQty(value: number): string {
  return value.toFixed(3);
}

export async function listTransaksiMasuk(query: ListTransaksiMasukQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = query.bahanId
    ? eq(transaksiBahanMasuk.bahanId, query.bahanId)
    : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select({
        transaksiMasukId: transaksiBahanMasuk.transaksiMasukId,
        tanggal: transaksiBahanMasuk.tanggal,
        jumlah: transaksiBahanMasuk.jumlah,
        hargaSatuan: transaksiBahanMasuk.hargaSatuan,
        subtotal: transaksiBahanMasuk.subtotal,
        pesananBahanId: transaksiBahanMasuk.pesananBahanId,
        bahanId: bahanBaku.bahanId,
        namaBahan: bahanBaku.namaBahan,
        satuan: bahanBaku.satuan,
        supplierId: suppliers.supplierId,
        namaSupplier: suppliers.namaSupplier,
        createdAt: transaksiBahanMasuk.createdAt,
      })
      .from(transaksiBahanMasuk)
      .innerJoin(bahanBaku, eq(transaksiBahanMasuk.bahanId, bahanBaku.bahanId))
      .innerJoin(suppliers, eq(transaksiBahanMasuk.supplierId, suppliers.supplierId))
      .where(whereClause)
      .orderBy(desc(transaksiBahanMasuk.transaksiMasukId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(transaksiBahanMasuk).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getTransaksiMasukById(id: number) {
  const [row] = await db
    .select({
      transaksiMasukId: transaksiBahanMasuk.transaksiMasukId,
      tanggal: transaksiBahanMasuk.tanggal,
      jumlah: transaksiBahanMasuk.jumlah,
      hargaSatuan: transaksiBahanMasuk.hargaSatuan,
      subtotal: transaksiBahanMasuk.subtotal,
      pesananBahanId: transaksiBahanMasuk.pesananBahanId,
      bahanId: bahanBaku.bahanId,
      namaBahan: bahanBaku.namaBahan,
      satuan: bahanBaku.satuan,
      supplierId: suppliers.supplierId,
      namaSupplier: suppliers.namaSupplier,
      userId: transaksiBahanMasuk.userId,
      createdAt: transaksiBahanMasuk.createdAt,
    })
    .from(transaksiBahanMasuk)
    .innerJoin(bahanBaku, eq(transaksiBahanMasuk.bahanId, bahanBaku.bahanId))
    .innerJoin(suppliers, eq(transaksiBahanMasuk.supplierId, suppliers.supplierId))
    .where(eq(transaksiBahanMasuk.transaksiMasukId, id))
    .limit(1);
  if (!row) throw new NotFoundError('Transaksi bahan masuk tidak ditemukan');
  return row;
}

/**
 * Penerimaan bahan langsung (tanpa PO): mencatat transaksi masuk, menambah stok
 * bahan baku, dan memperbarui harga satuan bahan ke harga beli terbaru. Atomik.
 */
export async function createTransaksiMasuk(
  userId: number,
  input: CreateTransaksiMasukInput,
) {
  const newId = await db.transaction(async (tx) => {
    const [bahan] = await tx
      .select()
      .from(bahanBaku)
      .where(eq(bahanBaku.bahanId, input.bahanId))
      .limit(1);
    if (!bahan) throw new NotFoundError('Bahan baku tidak ditemukan');

    const [supplier] = await tx
      .select({ supplierId: suppliers.supplierId })
      .from(suppliers)
      .where(eq(suppliers.supplierId, input.supplierId))
      .limit(1);
    if (!supplier) throw new NotFoundError('Supplier tidak ditemukan');

    const subtotal = Math.round(Number(input.jumlah) * input.hargaSatuan);

    const [created] = await tx
      .insert(transaksiBahanMasuk)
      .values({
        jumlah: input.jumlah,
        hargaSatuan: input.hargaSatuan,
        subtotal,
        pesananBahanId: null,
        bahanId: input.bahanId,
        supplierId: input.supplierId,
        userId,
      })
      .returning();

    await tx
      .update(bahanBaku)
      .set({
        stok: toQty(Number(bahan.stok) + Number(input.jumlah)),
        hargaSatuan: input.hargaSatuan,
      })
      .where(eq(bahanBaku.bahanId, input.bahanId));

    return created.transaksiMasukId;
  });

  return getTransaksiMasukById(newId);
}
