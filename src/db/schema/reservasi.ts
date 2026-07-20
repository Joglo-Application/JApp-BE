import { pgTable, serial, varchar, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { meja } from './meja';
import { users } from './users';

/**
 * Reservasi meja. Sebelumnya status meja diubah ke `reserved` tanpa menyimpan
 * detail apa pun — nama pemesan, jam, dan jumlah tamu hilang begitu saja.
 */
export const reservasi = pgTable('reservasi', {
  reservasiId: serial('reservasi_id').primaryKey(),
  mejaId: integer('meja_id')
    .notNull()
    .references(() => meja.mejaId, { onDelete: 'cascade' }),
  namaPemesan: varchar('nama_pemesan', { length: 100 }).notNull(),
  noTelp: varchar('no_telp', { length: 20 }),
  waktuReservasi: timestamp('waktu_reservasi', { withTimezone: true }).notNull(),
  jumlahTamu: integer('jumlah_tamu').notNull().default(1),
  catatan: text('catatan'),
  /** false = reservasi dibatalkan/selesai. */
  aktif: boolean('aktif').notNull().default(true),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  ...timestamps,
});

export type Reservasi = typeof reservasi.$inferSelect;
export type NewReservasi = typeof reservasi.$inferInsert;
