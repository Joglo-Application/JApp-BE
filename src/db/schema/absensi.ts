import { pgTable, serial, integer, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Absensi karyawan: satu baris per user per tanggal. `jam_masuk` diisi saat
 * check-in, `jam_keluar` saat check-out (null = belum keluar).
 */
export const absensi = pgTable(
  'absensi',
  {
    absensiId: serial('absensi_id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'restrict' }),
    tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
    jamMasuk: timestamp('jam_masuk', { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
    jamKeluar: timestamp('jam_keluar', { withTimezone: true }),
  },
  (t) => ({
    uniqUserTanggal: uniqueIndex('uniq_absensi_user_tanggal').on(t.userId, t.tanggal),
  }),
);

export type Absensi = typeof absensi.$inferSelect;
export type NewAbsensi = typeof absensi.$inferInsert;
