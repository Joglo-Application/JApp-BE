import { pgTable, serial, date, numeric, integer, text, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_helpers';
import { bahanBaku } from './bahan-baku';
import { menus } from './menus';
import { users } from './users';
import { stokDokumenStatusEnum, stokSumberEnum } from './stok-mutasi';

/**
 * Dokumen Stok Opname (SO-001): pencocokan stok sistem vs hasil hitung fisik.
 *
 * Berbentuk header + banyak baris item mengikuti layar Kelola Stok, sama
 * seperti stok masuk/keluar. Bentuk datar sebelumnya (satu bahan per baris,
 * tanpa status) tidak bisa mewakili dokumen yang dibuat dari layar itu.
 * Selisih baru diterapkan ke stok bahan saat dokumen diposting.
 */
export const stokOpname = pgTable('stok_opname', {
  opnameId: serial('opname_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  catatan: text('catatan'),
  status: stokDokumenStatusEnum('status').notNull().default('draft'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export const stokOpnameItem = pgTable('stok_opname_item', {
  itemId: serial('item_id').primaryKey(),
  opnameId: integer('opname_id')
    .notNull()
    .references(() => stokOpname.opnameId, { onDelete: 'cascade' }),
  /**
   * Satu dokumen opname boleh memuat bahan baku maupun produk jadi, sehingga
   * penghitungan fisik gudang dan etalase bisa dicatat bersama.
   */
  sumber: stokSumberEnum('sumber').notNull().default('stok_gudang'),
  bahanId: integer('bahan_id').references(() => bahanBaku.bahanId, {
    onDelete: 'restrict',
  }),
  menuId: integer('menu_id').references(() => menus.menuId, {
    onDelete: 'restrict',
  }),
  /** Nama saat dokumen dibuat, agar riwayat tetap terbaca. */
  nama: varchar('nama', { length: 100 }).notNull(),
  stokSistem: numeric('stok_sistem', { precision: 12, scale: 3 }).notNull(),
  stokFisik: numeric('stok_fisik', { precision: 12, scale: 3 }).notNull(),
  selisih: numeric('selisih', { precision: 12, scale: 3 }).notNull(),
});

/**
 * Dokumen Produksi Stok (PS-001): mencatat produk jadi yang diproduksi.
 * Menambah `menus.stok` saat diposting.
 */
export const produksiStok = pgTable('produksi_stok', {
  produksiId: serial('produksi_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  catatan: text('catatan'),
  status: stokDokumenStatusEnum('status').notNull().default('draft'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export const produksiStokItem = pgTable('produksi_stok_item', {
  itemId: serial('item_id').primaryKey(),
  produksiId: integer('produksi_id')
    .notNull()
    .references(() => produksiStok.produksiId, { onDelete: 'cascade' }),
  menuId: integer('menu_id')
    .notNull()
    .references(() => menus.menuId, { onDelete: 'restrict' }),
  nama: varchar('nama', { length: 100 }).notNull(),
  jumlah: integer('jumlah').notNull(),
});

export type StokOpname = typeof stokOpname.$inferSelect;
export type ProduksiStok = typeof produksiStok.$inferSelect;
