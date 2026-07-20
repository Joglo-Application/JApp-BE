import { pgTable, serial, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

/**
 * Master metode pembayaran yang bisa dikelola owner: mengatur apa yang tampil
 * dan aktif di layar kasir.
 *
 * Nama tabelnya diberi awalan `master_` karena di PostgreSQL tabel dan enum
 * berbagi namespace tipe yang sama, sedangkan nama `metode_pembayaran` sudah
 * dipakai enum di `pembayaran.ts` (nilai teknis yang diproses server).
 */
export const metodePembayaran = pgTable('master_metode_pembayaran', {
  metodeId: serial('metode_id').primaryKey(),
  nama: varchar('nama', { length: 60 }).notNull(),
  /** Nilai enum yang dipakai saat menyimpan pembayaran (cash/qris/debit/...). */
  kode: varchar('kode', { length: 30 }).notNull(),
  urutan: integer('urutan').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export type MetodePembayaran = typeof metodePembayaran.$inferSelect;
export type NewMetodePembayaran = typeof metodePembayaran.$inferInsert;
