import { pgTable, serial, date, numeric, pgEnum, text, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createdAtOnly } from './_helpers';
import { bahanBaku } from './bahan-baku';
import { pesanan } from './pesanan';
import { users } from './users';

export const tipeKeluarEnum = pgEnum('tipe_keluar', [
  'sale',
  'waste',
  'damaged',
  'expired',
  'adjustment',
]);

export const transaksiBahanKeluar = pgTable('transaksi_bahan_keluar', {
  transaksiKeluarId: serial('transaksi_keluar_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  jumlah: numeric('jumlah', { precision: 12, scale: 3 }).notNull(),
  tipeKeluar: tipeKeluarEnum('tipe_keluar').notNull(),
  keterangan: text('keterangan'),
  bahanId: integer('bahan_id')
    .notNull()
    .references(() => bahanBaku.bahanId, { onDelete: 'restrict' }),
  pesananId: integer('pesanan_id').references(() => pesanan.pesananId, {
    onDelete: 'set null',
  }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...createdAtOnly,
});

export type TransaksiBahanKeluar = typeof transaksiBahanKeluar.$inferSelect;
export type NewTransaksiBahanKeluar = typeof transaksiBahanKeluar.$inferInsert;
