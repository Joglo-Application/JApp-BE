import { pgTable, serial, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const menus = pgTable('menus', {
  menuId: serial('menu_id').primaryKey(),
  namaMenu: varchar('nama_menu', { length: 100 }).notNull(),
  kategori: varchar('kategori', { length: 50 }).notNull(),
  harga: integer('harga').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
