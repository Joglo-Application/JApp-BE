import { pgTable, serial, date, numeric, pgEnum, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_helpers';
import { bahanBaku } from './bahan-baku';
import { suppliers } from './suppliers';
import { users } from './users';

export const pesananBahanStatusEnum = pgEnum('pesanan_bahan_status', [
  'pending',
  'received',
  'cancelled',
]);

export const pesananBahan = pgTable('pesanan_bahan', {
  pesananBahanId: serial('pesanan_bahan_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  jumlah: numeric('jumlah', { precision: 12, scale: 3 }).notNull(),
  status: pesananBahanStatusEnum('status').notNull().default('pending'),
  bahanId: integer('bahan_id')
    .notNull()
    .references(() => bahanBaku.bahanId, { onDelete: 'restrict' }),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.supplierId, { onDelete: 'restrict' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export type PesananBahan = typeof pesananBahan.$inferSelect;
export type NewPesananBahan = typeof pesananBahan.$inferInsert;
