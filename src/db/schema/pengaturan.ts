import { pgTable, varchar, jsonb } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

/**
 * Penyimpanan pengaturan berbentuk key-value per grup (toko, pos, pajak,
 * mataUang, notifikasi, printer, absensi). Dipakai agar penambahan pengaturan
 * baru tidak perlu migrasi kolom.
 */
export const pengaturan = pgTable('pengaturan', {
  grup: varchar('grup', { length: 60 }).primaryKey(),
  nilai: jsonb('nilai').notNull(),
  ...timestamps,
});

export type Pengaturan = typeof pengaturan.$inferSelect;
export type NewPengaturan = typeof pengaturan.$inferInsert;
