import { pgTable, serial, date, pgEnum, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_helpers';
import { users } from './users';

export const pesananStatusEnum = pgEnum('pesanan_status', [
  'pending',
  'completed',
  'cancelled',
]);

export const pesanan = pgTable('pesanan', {
  pesananId: serial('pesanan_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  status: pesananStatusEnum('status').notNull().default('pending'),
  total: integer('total').notNull().default(0),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export type Pesanan = typeof pesanan.$inferSelect;
export type NewPesanan = typeof pesanan.$inferInsert;
