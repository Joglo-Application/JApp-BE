import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';

/** Label tipe order sesuai yang ditampilkan layar dapur (FE). */
function tipeLabel(orderType: string | null): string {
  return orderType === 'dine_in' ? 'DINE-IN' : 'TAKE-AWAY';
}

interface KitchenItem {
  nama: string;
  qty: number;
  catatan: string;
}

/**
 * Order aktif untuk dapur = pesanan berstatus `pending` (belum dibayar).
 * Saat pesanan dibayar (status `completed`) otomatis hilang dari daftar ini.
 * Dipetakan ke bentuk yang diharapkan `KitchenOrderModel.fromJson` di FE.
 */
export async function listActiveOrders() {
  const rows = await db
    .select({
      pesananId: pesanan.pesananId,
      orderType: pesanan.orderType,
      createdAt: pesanan.createdAt,
    })
    .from(pesanan)
    .where(eq(pesanan.status, 'pending'))
    // FIFO: yang paling lama masuk tampil duluan.
    .orderBy(asc(pesanan.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.pesananId);
  const details = await db
    .select({
      pesananId: detailPesanan.pesananId,
      jumlah: detailPesanan.jumlah,
      catatan: detailPesanan.catatan,
      namaMenu: menus.namaMenu,
      namaCustom: detailPesanan.namaCustom,
    })
    .from(detailPesanan)
    .leftJoin(menus, eq(menus.menuId, detailPesanan.menuId))
    .where(inArray(detailPesanan.pesananId, ids));

  const itemsByPesanan = new Map<number, KitchenItem[]>();
  for (const d of details) {
    const list = itemsByPesanan.get(d.pesananId) ?? [];
    list.push({
      nama: d.namaMenu ?? d.namaCustom ?? '',
      qty: d.jumlah,
      catatan: d.catatan ?? '',
    });
    itemsByPesanan.set(d.pesananId, list);
  }

  return rows.map((r) => ({
    id: String(r.pesananId),
    kodeTransaksi: `TRX-${String(r.pesananId).padStart(4, '0')}`,
    tipe: tipeLabel(r.orderType),
    startTime: r.createdAt.toISOString(),
    items: itemsByPesanan.get(r.pesananId) ?? [],
  }));
}
