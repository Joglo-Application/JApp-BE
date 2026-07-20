import { pgTable, serial, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

/**
 * Area/lantai toko (Lantai 1, Lantai 2, Taman, Lesehan). Sebelumnya layout
 * toko hanya ada sebagai daftar hardcoded di frontend, sehingga meja tidak
 * bisa dikelompokkan secara persisten.
 */
export const area = pgTable('area', {
  areaId: serial('area_id').primaryKey(),
  nama: varchar('nama', { length: 60 }).notNull(),
  /** Urutan tampil pada layar layout. */
  urutan: integer('urutan').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export type Area = typeof area.$inferSelect;
export type NewArea = typeof area.$inferInsert;
