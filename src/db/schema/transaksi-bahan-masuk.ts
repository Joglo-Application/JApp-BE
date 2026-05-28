import { pgTable, serial, date, numeric, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createdAtOnly } from './_helpers';
import { pesananBahan } from './pesanan-bahan';
import { bahanBaku } from './bahan-baku';
import { suppliers } from './suppliers';
import { users } from './users';

export const transaksiBahanMasuk = pgTable('transaksi_bahan_masuk', {
  transaksiMasukId: serial('transaksi_masuk_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  jumlah: numeric('jumlah', { precision: 12, scale: 3 }).notNull(),
  hargaSatuan: integer('harga_satuan').notNull(),
  subtotal: integer('subtotal').notNull(),
  pesananBahanId: integer('pesanan_bahan_id').references(() => pesananBahan.pesananBahanId, {
    onDelete: 'set null',
  }),
  bahanId: integer('bahan_id')
    .notNull()
    .references(() => bahanBaku.bahanId, { onDelete: 'restrict' }),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.supplierId, { onDelete: 'restrict' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...createdAtOnly,
});

export type TransaksiBahanMasuk = typeof transaksiBahanMasuk.$inferSelect;
export type NewTransaksiBahanMasuk = typeof transaksiBahanMasuk.$inferInsert;
