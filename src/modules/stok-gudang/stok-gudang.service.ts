import { asc } from 'drizzle-orm';
import { db } from '@/config/database';
import { bahanBaku } from '@/db/schema/bahan-baku';

/**
 * Stok gudang (bahan baku) untuk dashboard owner.
 * Dipetakan dari tabel `bahan_baku` ke bentuk yang diharapkan frontend.
 * Status (aman/rendah/habis) dihitung di sisi frontend dari qtyStok vs qtyTahan.
 */
export async function listStokGudang() {
  const rows = await db
    .select({
      bahanId: bahanBaku.bahanId,
      nama: bahanBaku.namaBahan,
      kategori: bahanBaku.kategori,
      satuan: bahanBaku.satuan,
      stok: bahanBaku.stok,
      stokMinimum: bahanBaku.stokMinimum,
      imageUrl: bahanBaku.imageUrl,
    })
    .from(bahanBaku)
    .orderBy(asc(bahanBaku.bahanId));

  return rows.map((r) => ({
    id: `STK-${String(r.bahanId).padStart(3, '0')}`,
    // Raw FK so the frontend can reference it in resep (POST /menus).
    bahanId: r.bahanId,
    nama: r.nama,
    // Frontend membaca `kategori` sebagai String non-null.
    kategori: r.kategori ?? '',
    unitProduk: r.satuan,
    // `stok`/`stokMinimum` adalah numeric (string dari driver) → konversi ke number.
    qtyStok: Number(r.stok),
    qtyTahan: Number(r.stokMinimum),
    imageUrl: r.imageUrl,
  }));
}
