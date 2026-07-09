import { pgTable, serial, integer, varchar, text, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_helpers';
import { users } from './users';

export const shiftKasStatusEnum = pgEnum('shift_kas_status', ['open', 'closed']);
export const shiftKasJenisEnum = pgEnum('shift_kas_jenis', ['setoran', 'penarikan']);

/**
 * Sesi shift kas seorang kasir. Satu kasir hanya boleh punya SATU shift `open`
 * pada satu waktu. `kas_akhir` diisi saat tutup (= kas awal + Σsetoran − Σpenarikan).
 */
export const shiftKas = pgTable('shift_kas', {
  shiftId: serial('shift_id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  kasAwal: integer('kas_awal').notNull().default(0),
  status: shiftKasStatusEnum('status').notNull().default('open'),
  waktuMulai: timestamp('waktu_mulai', { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  waktuSelesai: timestamp('waktu_selesai', { withTimezone: true }),
  kasAkhir: integer('kas_akhir'),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  ...timestamps,
});

/** Setoran (kas masuk) / penarikan (kas keluar) dalam sebuah shift. */
export const shiftKasEntry = pgTable('shift_kas_entry', {
  entryId: serial('entry_id').primaryKey(),
  shiftId: integer('shift_id')
    .notNull()
    .references(() => shiftKas.shiftId, { onDelete: 'cascade' }),
  jenis: shiftKasJenisEnum('jenis').notNull(),
  namaTransaksi: varchar('nama_transaksi', { length: 100 }).notNull(),
  jumlah: integer('jumlah').notNull(),
  catatan: text('catatan'),
  waktu: timestamp('waktu', { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ShiftKas = typeof shiftKas.$inferSelect;
export type NewShiftKas = typeof shiftKas.$inferInsert;
export type ShiftKasEntry = typeof shiftKasEntry.$inferSelect;
export type NewShiftKasEntry = typeof shiftKasEntry.$inferInsert;
