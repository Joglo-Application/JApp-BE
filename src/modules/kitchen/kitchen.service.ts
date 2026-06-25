import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';

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
 * Order aktif untuk dapur = pesanan berstatus `in_progress` (sedang diproses).
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
    // Order yang sedang diproses dapur (sebelumnya 'pending').
    .where(eq(pesanan.status, 'in_progress'))
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

/**
 * Dapur menyelesaikan sebuah pesanan (makanan sudah selesai dibuat & diserahkan)
 * → status `completed`, hilang dari layar dapur.
 *
 * Hanya untuk order NON Dine-In: Dine-In diselesaikan lewat pembayaran (agar
 * meja otomatis bebas), bukan dari sisi dapur.
 */
export async function completeOrder(id: number) {
  const [row] = await db
    .select({ status: pesanan.status, orderType: pesanan.orderType })
    .from(pesanan)
    .where(eq(pesanan.pesananId, id))
    .limit(1);
  if (!row) throw new NotFoundError('Pesanan tidak ditemukan');
  if (row.orderType === 'dine_in') {
    throw new BadRequestError(
      'Pesanan Dine-In diselesaikan lewat pembayaran, bukan dari dapur',
    );
  }
  if (row.status !== 'in_progress') {
    throw new ConflictError(
      `Pesanan dengan status "${row.status}" tidak dapat diselesaikan`,
    );
  }
  await db
    .update(pesanan)
    .set({ status: 'completed' })
    .where(eq(pesanan.pesananId, id));
}
