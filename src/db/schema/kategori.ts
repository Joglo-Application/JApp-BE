import { pgTable, serial, varchar, integer, boolean, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

/** Ruang lingkup kategori — satu tabel melayani tiga layar kategori di FE. */
export const kategoriJenisEnum = pgEnum('kategori_jenis', [
  'menu',
  'stok',
  'stok_gudang',
]);

export const kategori = pgTable(
  'kategori',
  {
    kategoriId: serial('kategori_id').primaryKey(),
    jenis: kategoriJenisEnum('jenis').notNull(),
    nama: varchar('nama', { length: 60 }).notNull(),
    /** Urutan tampil; layar kategori mendukung penyusunan ulang. */
    urutan: integer('urutan').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    uniqJenisNama: uniqueIndex('uniq_kategori_jenis_nama').on(t.jenis, t.nama),
  }),
);

export type Kategori = typeof kategori.$inferSelect;
export type NewKategori = typeof kategori.$inferInsert;
