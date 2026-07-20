import { pgTable, serial, varchar, integer, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { diskonTipeEnum } from './pesanan';
import { menus } from './menus';

export const loyaltyTipeEnum = pgEnum('loyalty_tipe', ['diskon', 'produk_gratis']);

/**
 * Katalog reward penukaran poin member. Menggantikan daftar reward yang
 * sebelumnya di-hardcode di klien — termasuk produk gratis yang kini
 * menunjuk menu nyata lewat `menu_id`, bukan id karangan.
 */
export const loyaltyReward = pgTable('loyalty_reward', {
  rewardId: serial('reward_id').primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  tipe: loyaltyTipeEnum('tipe').notNull(),
  /** Poin yang dipotong saat reward ditukar. */
  poin: integer('poin').notNull(),
  /** Diisi untuk tipe `diskon`. */
  diskonTipe: diskonTipeEnum('diskon_tipe'),
  diskonNilai: numeric('diskon_nilai', { precision: 12, scale: 2 }),
  /** Diisi untuk tipe `produk_gratis`. */
  menuId: integer('menu_id').references(() => menus.menuId, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export type LoyaltyReward = typeof loyaltyReward.$inferSelect;
export type NewLoyaltyReward = typeof loyaltyReward.$inferInsert;
