import { pgTable, serial, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { area } from './area';

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
  /** Pengelompokan meja per area/lantai (menggantikan `zona` bertahap). */
  areaId: integer('area_id').references(() => area.areaId, { onDelete: 'set null' }),
  kapasitas: integer('kapasitas').notNull().default(4),
  status: mejaStatusEnum('status').notNull().default('available'),
  ...timestamps,
});

export type Meja = typeof meja.$inferSelect;
export type NewMeja = typeof meja.$inferInsert;
