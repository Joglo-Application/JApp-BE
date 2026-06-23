import { pgTable, serial, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const mejaStatusEnum = pgEnum('meja_status', [
  'available',
  'occupied',
  'reserved',
  'blocked',
]);

export const meja = pgTable('meja', {
  mejaId: serial('meja_id').primaryKey(),
  nomor: varchar('nomor', { length: 30 }).notNull(),
  zona: varchar('zona', { length: 50 }),
  kapasitas: integer('kapasitas').notNull().default(4),
  status: mejaStatusEnum('status').notNull().default('available'),
  ...timestamps,
});

export type Meja = typeof meja.$inferSelect;
export type NewMeja = typeof meja.$inferInsert;
