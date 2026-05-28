import { pgTable, serial, varchar, text } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const suppliers = pgTable('suppliers', {
  supplierId: serial('supplier_id').primaryKey(),
  namaSupplier: varchar('nama_supplier', { length: 100 }).notNull(),
  noTelp: varchar('no_telp', { length: 20 }),
  alamat: text('alamat'),
  email: varchar('email', { length: 100 }),
  ...timestamps,
});

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
