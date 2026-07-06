import { pgTable, serial, varchar, text, timestamp, date, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Audit log aksi POS (khusus fitur POS): setiap aksi kasir saat menyusun
 * pesanan (ADD_QTY, VOID_ITEM, diskon, dll) dicatat satu baris.
 * `kode_transaksi` = kode sesi order dari FE (bukan FK pesanan — aksi terjadi
 * sebelum pesanan tersimpan).
 */
export const logTransaksi = pgTable('log_transaksi', {
  logId: serial('log_id').primaryKey(),
  tipe: varchar('tipe', { length: 40 }).notNull(),
  kodeTransaksi: varchar('kode_transaksi', { length: 50 }).notNull(),
  deskripsi: text('deskripsi').notNull(),
  waktu: timestamp('waktu', { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
});

export type LogTransaksi = typeof logTransaksi.$inferSelect;
export type NewLogTransaksi = typeof logTransaksi.$inferInsert;
