import { pgTable, serial, date, pgEnum, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createdAtOnly } from './_helpers';
import { pesanan } from './pesanan';

export const metodePembayaranEnum = pgEnum('metode_pembayaran', [
  'cash',
  'qris',
  'debit',
  'transfer',
  'qris_netzme',
]);

export const pembayaran = pgTable('pembayaran', {
  pembayaranId: serial('pembayaran_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  metode: metodePembayaranEnum('metode').notNull(),
  jumlahBayar: integer('jumlah_bayar').notNull(),
  kembalian: integer('kembalian').notNull().default(0),
  pesananId: integer('pesanan_id')
    .notNull()
    .unique()
    .references(() => pesanan.pesananId, { onDelete: 'cascade' }),
  ...createdAtOnly,
});

export type Pembayaran = typeof pembayaran.$inferSelect;
export type NewPembayaran = typeof pembayaran.$inferInsert;
