import { pgTable, serial, varchar, integer, boolean, date, text } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const menus = pgTable('menus', {
  menuId: serial('menu_id').primaryKey(),
  namaMenu: varchar('nama_menu', { length: 100 }).notNull(),
  kategori: varchar('kategori', { length: 50 }).notNull(),
  harga: integer('harga').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  // Stok level produk untuk tampilan inventori POS (GET /inventori).
  stok: integer('stok').notNull().default(0),
  /**
   * true = stok menu ini dipotong & divalidasi saat penjualan (untuk barang
   * jadi tanpa resep, mis. minuman botolan). Default false agar menu lama
   * yang stoknya belum diisi tidak ikut terblokir.
   */
  trackStok: boolean('track_stok').notNull().default(false),
  stokMinimum: integer('stok_minimum').notNull().default(0),
  imageUrl: varchar('image_url', { length: 255 }),
  // Royalty point opsional (poin yang didapat per pembelian menu ini).
  royaltyPoint: integer('royalty_point'),
  // Produk khusus: aktif untuk rentang tanggal tertentu.
  isProdukKhusus: boolean('is_produk_khusus').notNull().default(false),
  produkKhususMulai: date('produk_khusus_mulai'),
  produkKhususSelesai: date('produk_khusus_selesai'),
  catatan: text('catatan'),
  ...timestamps,
});

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
