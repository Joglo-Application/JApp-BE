import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { transaksiBahanKeluar } from '@/db/schema/transaksi-bahan-keluar';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type {
  CreateTransaksiKeluarInput,
  ListTransaksiKeluarQuery,
} from './transaksi-keluar.schema';

function toQty(value: number): string {
  return value.toFixed(3);
}

export async function listTransaksiKeluar(query: ListTransaksiKeluarQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  const whereClause = and(
    query.bahanId ? eq(transaksiBahanKeluar.bahanId, query.bahanId) : undefined,
    query.tipeKeluar ? eq(transaksiBahanKeluar.tipeKeluar, query.tipeKeluar) : undefined,
  );

  const [data, totalRows] = await Promise.all([
    db
      .select({
        transaksiKeluarId: transaksiBahanKeluar.transaksiKeluarId,
        tanggal: transaksiBahanKeluar.tanggal,
        jumlah: transaksiBahanKeluar.jumlah,
        tipeKeluar: transaksiBahanKeluar.tipeKeluar,
        keterangan: transaksiBahanKeluar.keterangan,
        bahanId: bahanBaku.bahanId,
        namaBahan: bahanBaku.namaBahan,
        satuan: bahanBaku.satuan,
        pesananId: transaksiBahanKeluar.pesananId,
        createdAt: transaksiBahanKeluar.createdAt,
      })
      .from(transaksiBahanKeluar)
      .innerJoin(bahanBaku, eq(transaksiBahanKeluar.bahanId, bahanBaku.bahanId))
      .where(whereClause)
      .orderBy(desc(transaksiBahanKeluar.transaksiKeluarId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(transaksiBahanKeluar).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getTransaksiKeluarById(id: number) {
  const [row] = await db
    .select({
      transaksiKeluarId: transaksiBahanKeluar.transaksiKeluarId,
      tanggal: transaksiBahanKeluar.tanggal,
      jumlah: transaksiBahanKeluar.jumlah,
      tipeKeluar: transaksiBahanKeluar.tipeKeluar,
      keterangan: transaksiBahanKeluar.keterangan,
      bahanId: bahanBaku.bahanId,
      namaBahan: bahanBaku.namaBahan,
      satuan: bahanBaku.satuan,
      pesananId: transaksiBahanKeluar.pesananId,
      userId: transaksiBahanKeluar.userId,
      createdAt: transaksiBahanKeluar.createdAt,
    })
    .from(transaksiBahanKeluar)
    .innerJoin(bahanBaku, eq(transaksiBahanKeluar.bahanId, bahanBaku.bahanId))
    .where(eq(transaksiBahanKeluar.transaksiKeluarId, id))
    .limit(1);
  if (!row) throw new NotFoundError('Transaksi bahan keluar tidak ditemukan');
  return row;
}

/**
 * Pengeluaran bahan manual (waste/damaged/expired/adjustment): mengurangi stok
 * bahan baku dan mencatat transaksinya. Atomik dalam satu transaksi DB.
 */
export async function createTransaksiKeluar(
  userId: number,
  input: CreateTransaksiKeluarInput,
) {
  const newId = await db.transaction(async (tx) => {
    const [bahan] = await tx
      .select()
      .from(bahanBaku)
      .where(eq(bahanBaku.bahanId, input.bahanId))
      .limit(1);
    if (!bahan) throw new NotFoundError('Bahan baku tidak ditemukan');

    const current = Number(bahan.stok);
    const jumlah = Number(input.jumlah);
    if (current < jumlah) {
      throw new ConflictError(
        `Stok "${bahan.namaBahan}" tidak mencukupi (tersedia ${current}, diminta ${jumlah})`,
      );
    }

    await tx
      .update(bahanBaku)
      .set({ stok: toQty(current - jumlah) })
      .where(eq(bahanBaku.bahanId, input.bahanId));

    const [created] = await tx
      .insert(transaksiBahanKeluar)
      .values({
        jumlah: input.jumlah,
        tipeKeluar: input.tipeKeluar,
        keterangan: input.keterangan ?? null,
        bahanId: input.bahanId,
        pesananId: null,
        userId,
      })
      .returning();

    return created.transaksiKeluarId;
  });

  return getTransaksiKeluarById(newId);
}
