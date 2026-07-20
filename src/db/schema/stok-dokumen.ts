import { pgTable, serial, date, numeric, integer, text, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createdAtOnly } from './_helpers';
import { bahanBaku } from './bahan-baku';
import { menus } from './menus';
import { users } from './users';

/**
 * Stok opname: pencocokan stok sistem vs stok fisik. Selisihnya langsung
 * diterapkan ke `bahan_baku.stok` saat dokumen dibuat.
 */
export const stokOpname = pgTable('stok_opname', {
  opnameId: serial('opname_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  bahanId: integer('bahan_id')
    .notNull()
    .references(() => bahanBaku.bahanId, { onDelete: 'restrict' }),
  stokSistem: numeric('stok_sistem', { precision: 12, scale: 3 }).notNull(),
  stokFisik: numeric('stok_fisik', { precision: 12, scale: 3 }).notNull(),
  selisih: numeric('selisih', { precision: 12, scale: 3 }).notNull(),
  catatan: text('catatan'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...createdAtOnly,
});

/**
 * Produksi stok: mengubah bahan baku menjadi stok menu siap jual
 * (untuk menu yang stoknya dikelola di level menu).
 */
export const produksiStok = pgTable('produksi_stok', {
  produksiId: serial('produksi_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  menuId: integer('menu_id')
    .notNull()
    .references(() => menus.menuId, { onDelete: 'restrict' }),
  jumlah: integer('jumlah').notNull(),
  catatan: text('catatan'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...createdAtOnly,
});

export type StokOpname = typeof stokOpname.$inferSelect;
export type ProduksiStok = typeof produksiStok.$inferSelect;
