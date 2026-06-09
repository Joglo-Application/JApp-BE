import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesananBahan } from '@/db/schema/pesanan-bahan';
import { transaksiBahanMasuk } from '@/db/schema/transaksi-bahan-masuk';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { suppliers } from '@/db/schema/suppliers';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type {
  CreatePesananBahanInput,
  ListPesananBahanQuery,
  ReceivePesananBahanInput,
} from './pesanan-bahan.schema';

function toQty(value: number): string {
  return value.toFixed(3);
}

export async function listPesananBahan(query: ListPesananBahanQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = query.status ? eq(pesananBahan.status, query.status) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select({
        pesananBahanId: pesananBahan.pesananBahanId,
        tanggal: pesananBahan.tanggal,
        jumlah: pesananBahan.jumlah,
        status: pesananBahan.status,
        bahanId: bahanBaku.bahanId,
        namaBahan: bahanBaku.namaBahan,
        satuan: bahanBaku.satuan,
        supplierId: suppliers.supplierId,
        namaSupplier: suppliers.namaSupplier,
        createdAt: pesananBahan.createdAt,
      })
      .from(pesananBahan)
      .innerJoin(bahanBaku, eq(pesananBahan.bahanId, bahanBaku.bahanId))
      .innerJoin(suppliers, eq(pesananBahan.supplierId, suppliers.supplierId))
      .where(whereClause)
      .orderBy(desc(pesananBahan.pesananBahanId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(pesananBahan).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getPesananBahanById(id: number) {
  const [row] = await db
    .select({
      pesananBahanId: pesananBahan.pesananBahanId,
      tanggal: pesananBahan.tanggal,
      jumlah: pesananBahan.jumlah,
      status: pesananBahan.status,
      bahanId: bahanBaku.bahanId,
      namaBahan: bahanBaku.namaBahan,
      satuan: bahanBaku.satuan,
      supplierId: suppliers.supplierId,
      namaSupplier: suppliers.namaSupplier,
      userId: pesananBahan.userId,
      createdAt: pesananBahan.createdAt,
      updatedAt: pesananBahan.updatedAt,
    })
    .from(pesananBahan)
    .innerJoin(bahanBaku, eq(pesananBahan.bahanId, bahanBaku.bahanId))
    .innerJoin(suppliers, eq(pesananBahan.supplierId, suppliers.supplierId))
    .where(eq(pesananBahan.pesananBahanId, id))
    .limit(1);
  if (!row) throw new NotFoundError('Purchase order tidak ditemukan');
  return row;
}

export async function createPesananBahan(userId: number, input: CreatePesananBahanInput) {
  const [bahan] = await db
    .select({ bahanId: bahanBaku.bahanId })
    .from(bahanBaku)
    .where(eq(bahanBaku.bahanId, input.bahanId))
    .limit(1);
  if (!bahan) throw new NotFoundError('Bahan baku tidak ditemukan');

  const [supplier] = await db
    .select({ supplierId: suppliers.supplierId })
    .from(suppliers)
    .where(eq(suppliers.supplierId, input.supplierId))
    .limit(1);
  if (!supplier) throw new NotFoundError('Supplier tidak ditemukan');

  const [created] = await db
    .insert(pesananBahan)
    .values({
      bahanId: input.bahanId,
      supplierId: input.supplierId,
      jumlah: input.jumlah,
      status: 'pending',
      userId,
    })
    .returning();

  return getPesananBahanById(created.pesananBahanId);
}

/**
 * Menerima (receive) sebuah PO: mencatat transaksi bahan masuk, menambah stok
 * bahan baku, memperbarui harga satuan bahan ke harga beli terbaru, dan
 * menandai PO `received`. Atomik dalam satu transaksi DB.
 */
export async function receivePesananBahan(
  userId: number,
  id: number,
  input: ReceivePesananBahanInput,
) {
  await db.transaction(async (tx) => {
    const [po] = await tx
      .select()
      .from(pesananBahan)
      .where(eq(pesananBahan.pesananBahanId, id))
      .limit(1);
    if (!po) throw new NotFoundError('Purchase order tidak ditemukan');
    if (po.status !== 'pending') {
      throw new ConflictError(`PO dengan status "${po.status}" tidak dapat diterima`);
    }

    const jumlah = input.jumlah ?? po.jumlah;
    const subtotal = Math.round(Number(jumlah) * input.hargaSatuan);

    const [bahan] = await tx
      .select()
      .from(bahanBaku)
      .where(eq(bahanBaku.bahanId, po.bahanId))
      .limit(1);
    if (!bahan) throw new NotFoundError('Bahan baku tidak ditemukan');

    await tx.insert(transaksiBahanMasuk).values({
      jumlah,
      hargaSatuan: input.hargaSatuan,
      subtotal,
      pesananBahanId: po.pesananBahanId,
      bahanId: po.bahanId,
      supplierId: po.supplierId,
      userId,
    });

    await tx
      .update(bahanBaku)
      .set({
        stok: toQty(Number(bahan.stok) + Number(jumlah)),
        hargaSatuan: input.hargaSatuan,
      })
      .where(eq(bahanBaku.bahanId, po.bahanId));

    await tx
      .update(pesananBahan)
      .set({ status: 'received' })
      .where(eq(pesananBahan.pesananBahanId, id));
  });

  return getPesananBahanById(id);
}

export async function cancelPesananBahan(id: number) {
  const [po] = await db
    .select()
    .from(pesananBahan)
    .where(eq(pesananBahan.pesananBahanId, id))
    .limit(1);
  if (!po) throw new NotFoundError('Purchase order tidak ditemukan');
  if (po.status !== 'pending') {
    throw new ConflictError(`PO dengan status "${po.status}" tidak dapat dibatalkan`);
  }

  await db
    .update(pesananBahan)
    .set({ status: 'cancelled' })
    .where(eq(pesananBahan.pesananBahanId, id));

  return getPesananBahanById(id);
}
