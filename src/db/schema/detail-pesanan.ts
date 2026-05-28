import { pgTable, serial, integer } from 'drizzle-orm/pg-core';
import { pesanan } from './pesanan';
import { menus } from './menus';

export const detailPesanan = pgTable('detail_pesanan', {
  detailId: serial('detail_id').primaryKey(),
  jumlah: integer('jumlah').notNull(),
  hargaSatuan: integer('harga_satuan').notNull(),
  subtotal: integer('subtotal').notNull(),
  pesananId: integer('pesanan_id')
    .notNull()
    .references(() => pesanan.pesananId, { onDelete: 'cascade' }),
  menuId: integer('menu_id')
    .notNull()
    .references(() => menus.menuId, { onDelete: 'restrict' }),
});

export type DetailPesanan = typeof detailPesanan.$inferSelect;
export type NewDetailPesanan = typeof detailPesanan.$inferInsert;
