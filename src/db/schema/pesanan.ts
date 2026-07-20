import {
  pgTable,
  serial,
  date,
  pgEnum,
  integer,
  numeric,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_helpers';
import { users } from './users';
import { meja } from './meja';
import { member } from './member';

export const pesananStatusEnum = pgEnum('pesanan_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

export const orderTypeEnum = pgEnum('order_type', [
  'dine_in',
  'take_away',
  'gofood',
  'grabfood',
  'shopeefood',
]);

export const diskonTipeEnum = pgEnum('diskon_tipe', ['amount', 'percent']);

export const pesanan = pgTable('pesanan', {
  pesananId: serial('pesanan_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  status: pesananStatusEnum('status').notNull().default('in_progress'),

  // Rincian uang (dihitung server-side agar konsisten dengan frontend)
  subtotal: integer('subtotal').notNull().default(0),
  serviceCharge: integer('service_charge').notNull().default(0),
  pajak: integer('pajak').notNull().default(0),
  diskon: integer('diskon').notNull().default(0),
  diskonTipe: diskonTipeEnum('diskon_tipe'),
  diskonNilai: numeric('diskon_nilai', { precision: 12, scale: 2 }),
  promoNama: varchar('promo_nama', { length: 100 }),
  total: integer('total').notNull().default(0),

  // Atribut pesanan
  orderType: orderTypeEnum('order_type'),
  customerNama: varchar('customer_nama', { length: 100 }),
  catatan: text('catatan'),
  /** Jumlah tamu — dipakai panel detail meja & laporan Guest Resto. */
  jumlahTamu: integer('jumlah_tamu'),

  // Retur transaksi yang sudah dibayar. Status pesanan sengaja tidak diubah
  // agar transaksi tetap muncul di riwayat/laporan, hanya ditandai retur.
  returAt: timestamp('retur_at', { withTimezone: true }),
  returAlasan: text('retur_alasan'),
  returUserId: integer('retur_user_id').references(() => users.userId, {
    onDelete: 'set null',
  }),

  // Relasi opsional
  mejaId: integer('meja_id').references(() => meja.mejaId, { onDelete: 'set null' }),
  memberId: integer('member_id').references(() => member.memberId, {
    onDelete: 'set null',
  }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export type Pesanan = typeof pesanan.$inferSelect;
export type NewPesanan = typeof pesanan.$inferInsert;
