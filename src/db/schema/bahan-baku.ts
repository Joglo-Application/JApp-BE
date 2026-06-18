import { pgTable, serial, varchar, numeric, integer } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const bahanBaku = pgTable('bahan_baku', {
  bahanId: serial('bahan_id').primaryKey(),
  namaBahan: varchar('nama_bahan', { length: 100 }).notNull(),
  satuan: varchar('satuan', { length: 20 }).notNull(),
  stok: numeric('stok', { precision: 12, scale: 3 }).notNull().default('0'),
  stokMinimum: numeric('stok_minimum', { precision: 12, scale: 3 }).notNull().default('0'),
  hargaSatuan: integer('harga_satuan').notNull().default(0),
  // Untuk tampilan stok gudang owner (GET /stok-gudang).
  kategori: varchar('kategori', { length: 50 }),
  imageUrl: varchar('image_url', { length: 255 }),
  ...timestamps,
});

export type BahanBaku = typeof bahanBaku.$inferSelect;
export type NewBahanBaku = typeof bahanBaku.$inferInsert;
