import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/config/database';
import { absensi } from '@/db/schema/absensi';
import { users } from '@/db/schema/users';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { ListAbsensiQuery } from './absensi.schema';

/** Absen masuk (check-in) untuk hari ini. Satu kali per hari. */
export async function checkIn(userId: number) {
  const [existing] = await db
    .select()
    .from(absensi)
    .where(and(eq(absensi.userId, userId), eq(absensi.tanggal, sql`CURRENT_DATE`)))
    .limit(1);
  if (existing) throw new ConflictError('Sudah absen masuk hari ini');
  const [created] = await db.insert(absensi).values({ userId }).returning();
  return created;
}

/** Absen keluar (check-out) untuk record hari ini. */
export async function checkOut(userId: number) {
  const [existing] = await db
    .select()
    .from(absensi)
    .where(and(eq(absensi.userId, userId), eq(absensi.tanggal, sql`CURRENT_DATE`)))
    .limit(1);
  if (!existing) throw new NotFoundError('Belum absen masuk hari ini');
  if (existing.jamKeluar) throw new ConflictError('Sudah absen keluar hari ini');
  const [updated] = await db
    .update(absensi)
    .set({ jamKeluar: new Date() })
    .where(eq(absensi.absensiId, existing.absensiId))
    .returning();
  return updated;
}

/**
 * Daftar absensi (untuk SPV → Absensi Karyawan). Filter per tanggal.
 * Bentuk cocok dengan `_AbsensiRecord` di FE (nama, tanggal, jamMasuk, jamKeluar).
 */
export async function listAbsensi(query: ListAbsensiQuery) {
  const rows = await db
    .select({
      nama: users.namaUser,
      tanggal: absensi.tanggal,
      jamMasuk: absensi.jamMasuk,
      jamKeluar: absensi.jamKeluar,
    })
    .from(absensi)
    .innerJoin(users, eq(users.userId, absensi.userId))
    .where(query.date ? eq(absensi.tanggal, query.date) : undefined)
    .orderBy(desc(absensi.jamMasuk));

  return rows.map((r) => ({
    nama: r.nama,
    tanggal: r.tanggal,
    jamMasuk: r.jamMasuk.toISOString(),
    jamKeluar: r.jamKeluar?.toISOString() ?? null,
  }));
}
