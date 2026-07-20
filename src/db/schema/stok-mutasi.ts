import { pgTable, serial, varchar, integer, text, date, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_helpers';
import { users } from './users';
import { menus } from './menus';
import { bahanBaku } from './bahan-baku';

/** Siklus dokumen: draft belum menyentuh stok, posted sudah, cancelled dibatalkan. */
export const stokDokumenStatusEnum = pgEnum('stok_dokumen_status', [
  'draft',
  'posted',
  'cancelled',
]);

/** Asal item: produk jadi (menu/inventori) atau bahan baku (stok gudang). */
export const stokSumberEnum = pgEnum('stok_sumber', ['inventori', 'stok_gudang']);

/**
 * Dokumen Stok Masuk (SM-001). Berbeda dari `transaksi_bahan_masuk` yang
 * berupa baris datar per bahan dan wajib terkait supplier: dokumen ini
 * berkepala dengan banyak baris item, supplier hanya keterangan opsional, dan
 * itemnya bisa berupa menu maupun bahan baku — sesuai layar Kelola Stok.
 */
export const stokMasuk = pgTable('stok_masuk', {
  stokMasukId: serial('stok_masuk_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  supplier: varchar('supplier', { length: 100 }),
  catatan: text('catatan'),
  status: stokDokumenStatusEnum('status').notNull().default('draft'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export const stokMasukItem = pgTable('stok_masuk_item', {
  itemId: serial('item_id').primaryKey(),
  stokMasukId: integer('stok_masuk_id')
    .notNull()
    .references(() => stokMasuk.stokMasukId, { onDelete: 'cascade' }),
  sumber: stokSumberEnum('sumber').notNull(),
  menuId: integer('menu_id').references(() => menus.menuId, { onDelete: 'set null' }),
  bahanId: integer('bahan_id').references(() => bahanBaku.bahanId, { onDelete: 'set null' }),
  /** Nama saat dokumen dibuat, agar riwayat tetap terbaca bila item dihapus. */
  nama: varchar('nama', { length: 100 }).notNull(),
  jumlah: integer('jumlah').notNull(),
});

/** Dokumen Stok Keluar (SK-001). Itemnya membawa harga untuk nilai kerugian. */
export const stokKeluar = pgTable('stok_keluar', {
  stokKeluarId: serial('stok_keluar_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  catatan: text('catatan'),
  status: stokDokumenStatusEnum('status').notNull().default('draft'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export const stokKeluarItem = pgTable('stok_keluar_item', {
  itemId: serial('item_id').primaryKey(),
  stokKeluarId: integer('stok_keluar_id')
    .notNull()
    .references(() => stokKeluar.stokKeluarId, { onDelete: 'cascade' }),
  sumber: stokSumberEnum('sumber').notNull(),
  menuId: integer('menu_id').references(() => menus.menuId, { onDelete: 'set null' }),
  bahanId: integer('bahan_id').references(() => bahanBaku.bahanId, { onDelete: 'set null' }),
  nama: varchar('nama', { length: 100 }).notNull(),
  harga: integer('harga').notNull().default(0),
  jumlah: integer('jumlah').notNull(),
});

export type StokMasuk = typeof stokMasuk.$inferSelect;
export type StokKeluar = typeof stokKeluar.$inferSelect;
