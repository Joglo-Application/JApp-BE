import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { logGudang } from '@/db/schema/log-gudang';
import { users } from '@/db/schema/users';
import type { CreateLogGudangInput, ListLogGudangQuery } from './log-gudang.schema';

/** Catat satu aksi gudang. `waktu`/`tanggal` di-stamp server. */
export async function createLog(userId: number, input: CreateLogGudangInput) {
  const [created] = await db
    .insert(logGudang)
    .values({ jenis: input.jenis, logs: input.logs, userId })
    .returning();
  return created;
}

/**
 * Daftar log untuk halaman Owner → Log Gudang. Filter tanggal & jenis,
 * terbaru dulu. Bentuk cocok dengan `LogGudangEntry` di FE.
 */
export async function listLog(query: ListLogGudangQuery) {
  const conditions = [];
  if (query.date) conditions.push(eq(logGudang.tanggal, query.date));
  if (query.jenis) conditions.push(eq(logGudang.jenis, query.jenis));

  const rows = await db
    .select({
      jenis: logGudang.jenis,
      logs: logGudang.logs,
      waktu: logGudang.waktu,
      tanggal: logGudang.tanggal,
      author: users.namaUser,
    })
    .from(logGudang)
    .innerJoin(users, eq(users.userId, logGudang.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(logGudang.waktu));

  return rows.map((r) => ({
    jenis: r.jenis,
    author: r.author,
    logs: r.logs,
    tanggal: r.tanggal,
    waktu: r.waktu.toISOString(),
  }));
}
