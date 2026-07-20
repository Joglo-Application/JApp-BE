import { pgTable, serial, varchar, integer, numeric, boolean, date } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { diskonTipeEnum } from './pesanan';

/**
 * Master promo/voucher. Nilai diskon dihitung server-side lewat
 * `POST /promo/validate` agar kode & besaran potongan tidak bisa
 * dimanipulasi dari klien.
 */
export const promo = pgTable('promo', {
  promoId: serial('promo_id').primaryKey(),
  kode: varchar('kode', { length: 30 }).notNull().unique(),
  nama: varchar('nama', { length: 100 }).notNull(),
  tipe: diskonTipeEnum('tipe').notNull(),
  /** Nominal rupiah bila tipe `amount`, persen (0-100) bila `percent`. */
  nilai: numeric('nilai', { precision: 12, scale: 2 }).notNull(),
  /** Minimal subtotal agar promo berlaku. */
  minBelanja: integer('min_belanja').notNull().default(0),
  /** Batas maksimum potongan untuk tipe `percent`. Null = tanpa batas. */
  maxDiskon: integer('max_diskon'),
  isActive: boolean('is_active').notNull().default(true),
  /** Rentang berlaku. Null = tanpa batas di sisi tersebut. */
  mulai: date('mulai'),
  berakhir: date('berakhir'),
  ...timestamps,
});

export type Promo = typeof promo.$inferSelect;
export type NewPromo = typeof promo.$inferInsert;
