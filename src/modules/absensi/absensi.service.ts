import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/config/database';
import { absensi } from '@/db/schema/absensi';
import { users } from '@/db/schema/users';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { jamLokal, toCsv } from '@/shared/csv';
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
 * Rekap absensi sebagai CSV untuk tombol Export di halaman Pegawai.
 * Jam ditampilkan dalam waktu lokal toko, bukan UTC, agar langsung terbaca.
 */
export async function exportAbsensi(query: { start?: string; end?: string }) {
  const kondisi = [];
  if (query.start) kondisi.push(gte(absensi.tanggal, query.start));
  if (query.end) kondisi.push(lte(absensi.tanggal, query.end));

  const rows = await db
    .select({
      nama: users.namaUser,
      role: users.role,
      tanggal: absensi.tanggal,
      jamMasuk: absensi.jamMasuk,
      jamKeluar: absensi.jamKeluar,
    })
    .from(absensi)
    .innerJoin(users, eq(users.userId, absensi.userId))
    .where(kondisi.length ? and(...kondisi) : undefined)
    .orderBy(desc(absensi.tanggal), users.namaUser);

  const rentang = `${query.start ?? 'awal'}-sd-${query.end ?? 'akhir'}`;
  return {
    filename: `absensi-${rentang}.csv`,
    csv: toCsv(
      ['Nama', 'Role', 'Tanggal', 'Jam Masuk', 'Jam Keluar'],
      rows.map((r) => [r.nama, r.role, r.tanggal, jamLokal(r.jamMasuk), jamLokal(r.jamKeluar)]),
    ),
  };
}

/**
 * Absensi milik pengguna yang sedang login: status hari ini + riwayat.
 * Dipakai halaman Absensi karyawan (semua role) — `GET /absensi` dibatasi
 * SPV/owner/admin sehingga kasir tidak bisa memakainya.
 */
export async function getAbsensiSaya(userId: number, limit = 30) {
  const rows = await db
    .select({
      tanggal: absensi.tanggal,
      jamMasuk: absensi.jamMasuk,
      jamKeluar: absensi.jamKeluar,
    })
    .from(absensi)
    .where(eq(absensi.userId, userId))
    .orderBy(desc(absensi.tanggal))
    .limit(limit);

  const today = new Date().toISOString().slice(0, 10);
  const hariIni = rows.find((r) => r.tanggal === today);

  return {
    hariIni: {
      sudahMasuk: hariIni !== undefined,
      sudahKeluar: Boolean(hariIni?.jamKeluar),
      jamMasuk: hariIni?.jamMasuk.toISOString() ?? null,
      jamKeluar: hariIni?.jamKeluar?.toISOString() ?? null,
    },
    riwayat: rows.map((r) => ({
      tanggal: r.tanggal,
      jamMasuk: r.jamMasuk.toISOString(),
      jamKeluar: r.jamKeluar?.toISOString() ?? null,
    })),
  };
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
