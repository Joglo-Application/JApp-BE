import { pgTable, serial, varchar, integer, text, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const member = pgTable(
  'member',
  {
    memberId: serial('member_id').primaryKey(),
    nama: varchar('nama', { length: 100 }).notNull(),
    noTelp: varchar('no_telp', { length: 20 }),
    email: varchar('email', { length: 100 }),
    poin: integer('poin').notNull().default(0),
    // Data profil yang sudah dikumpulkan form member di POS tapi sebelumnya
    // tidak punya kolom, sehingga isinya terbuang diam-diam saat disimpan.
    gender: varchar('gender', { length: 20 }),
    tanggalLahir: date('tanggal_lahir'),
    alamat: text('alamat'),
    catatan: text('catatan'),
    ...timestamps,
  },
  (table) => ({
    uniqueTelp: uniqueIndex('uniq_member_no_telp').on(table.noTelp),
  }),
);

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
