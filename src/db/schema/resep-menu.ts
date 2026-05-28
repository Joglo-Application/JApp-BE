import { pgTable, serial, integer, numeric, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { menus } from './menus';
import { bahanBaku } from './bahan-baku';

export const resepMenu = pgTable(
  'resep_menu',
  {
    resepId: serial('resep_id').primaryKey(),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.menuId, { onDelete: 'cascade' }),
    bahanId: integer('bahan_id')
      .notNull()
      .references(() => bahanBaku.bahanId, { onDelete: 'restrict' }),
    jumlahPakai: numeric('jumlah_pakai', { precision: 12, scale: 3 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    uniqueMenuBahan: uniqueIndex('uniq_menu_bahan').on(table.menuId, table.bahanId),
  }),
);

export type ResepMenu = typeof resepMenu.$inferSelect;
export type NewResepMenu = typeof resepMenu.$inferInsert;
