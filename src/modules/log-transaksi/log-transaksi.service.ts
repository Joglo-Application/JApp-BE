import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { logTransaksi } from '@/db/schema/log-transaksi';
import { users } from '@/db/schema/users';
import type { CreateLogInput, ListLogQuery } from './log-transaksi.schema';

/** Catat satu aksi POS. `waktu` & `tanggal` di-stamp server (real-time). */
export async function createLog(userId: number, input: CreateLogInput) {
  const [created] = await db
    .insert(logTransaksi)
    .values({
      tipe: input.tipe,
      kodeTransaksi: input.kodeTransaksi,
      deskripsi: input.deskripsi,
      userId,
    })
    .returning();
  return created;
}

/**
 * Daftar log untuk panel Laporan → Log Transaksi. Filter per tanggal & tipe,
 * terbaru dulu. Bentuk cocok dengan `LogTransaksiEntry` di FE.
 */
export async function listLog(query: ListLogQuery) {
  const conditions = [];
  if (query.date) conditions.push(eq(logTransaksi.tanggal, query.date));
  if (query.tipe) conditions.push(eq(logTransaksi.tipe, query.tipe));

  const rows = await db
    .select({
      tipe: logTransaksi.tipe,
      kodeTransaksi: logTransaksi.kodeTransaksi,
      deskripsi: logTransaksi.deskripsi,
      waktu: logTransaksi.waktu,
      namaKasir: users.namaUser,
    })
    .from(logTransaksi)
    .innerJoin(users, eq(users.userId, logTransaksi.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(logTransaksi.waktu));

  return rows.map((r) => ({
    tipe: r.tipe,
    kodeTransaksi: r.kodeTransaksi,
    namaKasir: r.namaKasir,
    deskripsi: r.deskripsi,
    waktu: r.waktu.toISOString(),
  }));
}
