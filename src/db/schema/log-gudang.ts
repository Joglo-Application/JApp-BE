import { pgTable, serial, varchar, text, integer, timestamp, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Audit log operasi Stok Gudang (tambah/edit/hapus bahan baku, ubah stok, dll).
 * Analog dengan `log_transaksi` tapi untuk domain gudang. Dicatat oleh FE saat
 * user (gudang) melakukan aksi.
 */
export const logGudang = pgTable('log_gudang', {
  logId: serial('log_id').primaryKey(),
  jenis: varchar('jenis', { length: 40 }).notNull(),
  logs: text('logs').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  waktu: timestamp('waktu', { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
});

export type LogGudang = typeof logGudang.$inferSelect;
export type NewLogGudang = typeof logGudang.$inferInsert;
