import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { pembayaran } from '@/db/schema/pembayaran';
import { pesanan } from '@/db/schema/pesanan';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type { CreatePembayaranInput, ListPembayaranQuery } from './pembayaran.schema';

/**
 * Memproses pembayaran sebuah pesanan:
 * - validasi pesanan masih `pending` dan belum dibayar,
 * - validasi jumlah bayar mencukupi total,
 * - menghitung kembalian,
 * - menandai pesanan `completed`.
 * Atomik dalam satu transaksi DB.
 */
export async function createPembayaran(input: CreatePembayaranInput) {
  const newId = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(pesanan)
      .where(eq(pesanan.pesananId, input.pesananId))
      .limit(1);
    if (!order) throw new NotFoundError('Pesanan tidak ditemukan');
    if (order.status === 'cancelled') {
      throw new ConflictError('Pesanan sudah dibatalkan');
    }
    if (order.status === 'completed') {
      throw new ConflictError('Pesanan sudah dibayar');
    }

    const [existing] = await tx
      .select({ pembayaranId: pembayaran.pembayaranId })
      .from(pembayaran)
      .where(eq(pembayaran.pesananId, input.pesananId))
      .limit(1);
    if (existing) {
      throw new ConflictError('Pembayaran untuk pesanan ini sudah ada');
    }

    if (input.jumlahBayar < order.total) {
      throw new BadRequestError(
        `Jumlah bayar kurang (total ${order.total}, dibayar ${input.jumlahBayar})`,
      );
    }

    const kembalian = input.jumlahBayar - order.total;

    const [created] = await tx
      .insert(pembayaran)
      .values({
        pesananId: input.pesananId,
        metode: input.metode,
        jumlahBayar: input.jumlahBayar,
        kembalian,
      })
      .returning();

    await tx
      .update(pesanan)
      .set({ status: 'completed' })
      .where(eq(pesanan.pesananId, input.pesananId));

    return created.pembayaranId;
  });

  return getPembayaranById(newId);
}

export async function listPembayaran(query: ListPembayaranQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = query.metode ? eq(pembayaran.metode, query.metode) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(pembayaran)
      .where(whereClause)
      .orderBy(desc(pembayaran.pembayaranId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(pembayaran).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getPembayaranById(id: number) {
  const [row] = await db
    .select()
    .from(pembayaran)
    .where(eq(pembayaran.pembayaranId, id))
    .limit(1);
  if (!row) throw new NotFoundError('Pembayaran tidak ditemukan');
  return row;
}
