import { asc } from 'drizzle-orm';
import { db } from '@/config/database';
import { menus } from '@/db/schema/menus';

/**
 * Stok level produk untuk halaman inventori POS.
 * Dipetakan dari tabel `menus` ke bentuk yang diharapkan frontend.
 */
export async function listInventori() {
  const rows = await db
    .select({
      menuId: menus.menuId,
      nama: menus.namaMenu,
      kategori: menus.kategori,
      qtyStok: menus.stok,
      qtyTahan: menus.stokMinimum,
      imageUrl: menus.imageUrl,
    })
    .from(menus)
    .orderBy(asc(menus.menuId));

  return rows.map((r) => ({
    id: `INV-${String(r.menuId).padStart(3, '0')}`,
    nama: r.nama,
    kategori: r.kategori,
    qtyStok: r.qtyStok,
    qtyTahan: r.qtyTahan,
    imageUrl: r.imageUrl,
  }));
}
