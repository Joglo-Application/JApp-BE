import { pgTable, serial, integer, varchar, text } from 'drizzle-orm/pg-core';
import { pesanan } from './pesanan';
import { menus } from './menus';

export const detailPesanan = pgTable('detail_pesanan', {
  detailId: serial('detail_id').primaryKey(),
  jumlah: integer('jumlah').notNull(),
  hargaSatuan: integer('harga_satuan').notNull(),
  diskon: integer('diskon').notNull().default(0),
  subtotal: integer('subtotal').notNull(),
  catatan: text('catatan'),
  pesananId: integer('pesanan_id')
    .notNull()
    .references(() => pesanan.pesananId, { onDelete: 'cascade' }),
  // Nullable: baris bisa berupa menu asli ATAU item custom (ad-hoc).
  menuId: integer('menu_id').references(() => menus.menuId, { onDelete: 'restrict' }),
  // Untuk item custom yang bukan dari tabel menu.
  namaCustom: varchar('nama_custom', { length: 100 }),
});

export type DetailPesanan = typeof detailPesanan.$inferSelect;
export type NewDetailPesanan = typeof detailPesanan.$inferInsert;
