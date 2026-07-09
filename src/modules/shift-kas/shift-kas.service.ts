import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { shiftKas, shiftKasEntry } from '@/db/schema/shift-kas';
import { users } from '@/db/schema/users';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import type { CreateEntryInput, ListShiftQuery, UpdateEntryInput } from './shift-kas.schema';

/** Bentuk satu shift + entri + total, cocok untuk FE ShiftKasProvider. */
async function buildShift(shiftId: number) {
  const [row] = await db
    .select({
      shiftId: shiftKas.shiftId,
      userId: shiftKas.userId,
      namaKasir: users.namaUser,
      kasAwal: shiftKas.kasAwal,
      status: shiftKas.status,
      waktuMulai: shiftKas.waktuMulai,
      waktuSelesai: shiftKas.waktuSelesai,
      kasAkhir: shiftKas.kasAkhir,
      tanggal: shiftKas.tanggal,
    })
    .from(shiftKas)
    .innerJoin(users, eq(users.userId, shiftKas.userId))
    .where(eq(shiftKas.shiftId, shiftId))
    .limit(1);
  if (!row) throw new NotFoundError('Shift tidak ditemukan');

  const entries = await db
    .select()
    .from(shiftKasEntry)
    .where(eq(shiftKasEntry.shiftId, shiftId))
    .orderBy(desc(shiftKasEntry.waktu));

  const totalMasuk = entries
    .filter((e) => e.jenis === 'setoran')
    .reduce((s, e) => s + e.jumlah, 0);
  const totalKeluar = entries
    .filter((e) => e.jenis === 'penarikan')
    .reduce((s, e) => s + e.jumlah, 0);

  return {
    ...row,
    waktuMulai: row.waktuMulai.toISOString(),
    waktuSelesai: row.waktuSelesai?.toISOString() ?? null,
    totalMasuk,
    totalKeluar,
    totalKas: row.kasAwal + totalMasuk - totalKeluar,
    entries: entries.map((e) => ({
      entryId: e.entryId,
      jenis: e.jenis,
      namaTransaksi: e.namaTransaksi,
      jumlah: e.jumlah,
      catatan: e.catatan ?? '',
      waktu: e.waktu.toISOString(),
    })),
  };
}

/** Shift `open` milik user (untuk restore state), atau null. */
export async function getActiveShift(userId: number) {
  const [row] = await db
    .select({ shiftId: shiftKas.shiftId })
    .from(shiftKas)
    .where(and(eq(shiftKas.userId, userId), eq(shiftKas.status, 'open')))
    .limit(1);
  return row ? buildShift(row.shiftId) : null;
}

/** Mulai shift baru. Tolak bila user masih punya shift `open`. */
export async function startShift(userId: number, kasAwal: number) {
  const [open] = await db
    .select({ shiftId: shiftKas.shiftId })
    .from(shiftKas)
    .where(and(eq(shiftKas.userId, userId), eq(shiftKas.status, 'open')))
    .limit(1);
  if (open) {
    throw new ConflictError(`Masih ada shift aktif (#${open.shiftId}). Tutup dulu sebelum memulai shift baru.`);
  }
  const [created] = await db.insert(shiftKas).values({ userId, kasAwal }).returning();
  return buildShift(created.shiftId);
}

/** Ambil shift open milik user & pastikan masih terbuka. */
async function assertOwnOpenShift(userId: number, shiftId: number) {
  const [s] = await db.select().from(shiftKas).where(eq(shiftKas.shiftId, shiftId)).limit(1);
  if (!s) throw new NotFoundError('Shift tidak ditemukan');
  if (s.userId !== userId) throw new ForbiddenError('Bukan shift milik Anda');
  if (s.status !== 'open') throw new ConflictError('Shift sudah ditutup');
  return s;
}

export async function addEntry(userId: number, shiftId: number, input: CreateEntryInput) {
  await assertOwnOpenShift(userId, shiftId);
  await db.insert(shiftKasEntry).values({
    shiftId,
    jenis: input.jenis,
    namaTransaksi: input.namaTransaksi,
    jumlah: input.jumlah,
    catatan: input.catatan ?? null,
  });
  return buildShift(shiftId);
}

/** Cari entri + shift-nya, pastikan milik user & shift masih open. */
async function findOwnEntry(userId: number, entryId: number) {
  const [e] = await db.select().from(shiftKasEntry).where(eq(shiftKasEntry.entryId, entryId)).limit(1);
  if (!e) throw new NotFoundError('Entri tidak ditemukan');
  await assertOwnOpenShift(userId, e.shiftId);
  return e;
}

export async function updateEntry(userId: number, entryId: number, input: UpdateEntryInput) {
  const e = await findOwnEntry(userId, entryId);
  await db
    .update(shiftKasEntry)
    .set({
      namaTransaksi: input.namaTransaksi,
      jumlah: input.jumlah,
      catatan: input.catatan === undefined ? undefined : input.catatan,
    })
    .where(eq(shiftKasEntry.entryId, entryId));
  return buildShift(e.shiftId);
}

export async function deleteEntry(userId: number, entryId: number) {
  const e = await findOwnEntry(userId, entryId);
  await db.delete(shiftKasEntry).where(eq(shiftKasEntry.entryId, entryId));
  return buildShift(e.shiftId);
}

/** Tutup shift: hitung kas akhir, set waktu selesai & status closed. */
export async function closeShift(userId: number, shiftId: number) {
  await assertOwnOpenShift(userId, shiftId);
  const built = await buildShift(shiftId);
  await db
    .update(shiftKas)
    .set({ status: 'closed', waktuSelesai: new Date(), kasAkhir: built.totalKas })
    .where(eq(shiftKas.shiftId, shiftId));
  return buildShift(shiftId);
}

export async function getShiftById(id: number) {
  return buildShift(id);
}

/**
 * Riwayat shift. Kasir hanya lihat miliknya; admin/owner/supervisor lihat semua.
 * Filter opsional per tanggal.
 */
export async function listShifts(query: ListShiftQuery, opts: { userId?: number }) {
  const conditions = [];
  if (opts.userId !== undefined) conditions.push(eq(shiftKas.userId, opts.userId));
  if (query.date) conditions.push(eq(shiftKas.tanggal, query.date));

  const rows = await db
    .select({ shiftId: shiftKas.shiftId })
    .from(shiftKas)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(shiftKas.shiftId));

  return Promise.all(rows.map((r) => buildShift(r.shiftId)));
}
