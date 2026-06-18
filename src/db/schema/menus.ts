import { pgTable, serial, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const menus = pgTable('menus', {
  menuId: serial('menu_id').primaryKey(),
  namaMenu: varchar('nama_menu', { length: 100 }).notNull(),
  kategori: varchar('kategori', { length: 50 }).notNull(),
  harga: integer('harga').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  // Stok level produk untuk tampilan inventori POS (GET /inventori).
  stok: integer('stok').notNull().default(0),
  stokMinimum: integer('stok_minimum').notNull().default(0),
  imageUrl: varchar('image_url', { length: 255 }),
  ...timestamps,
});

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
