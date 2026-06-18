import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { pembayaran } from '@/db/schema/pembayaran';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { users } from '@/db/schema/users';
import { member } from '@/db/schema/member';

/** Label metode pembayaran sesuai yang ditampilkan frontend. */
const metodeLabel: Record<string, string> = {
  cash: 'TUNAI',
  qris: 'QRIS',
  qris_netzme: 'QRIS',
  debit: 'Debit',
  transfer: 'Transfer',
};

/** Persentase (dibulatkan) dari sebuah nominal terhadap subtotal — untuk display. */
function pct(amount: number, base: number): number {
  if (base <= 0) return 0;
  return Math.round((amount / base) * 100);
}

interface TransaksiItem {
  nama: string;
  hargaSatuan: number;
  qty: number;
  total: number;
}

/**
 * Riwayat transaksi (pesanan yang sudah dibayar) pada satu tanggal.
 * Menggabungkan pesanan + pembayaran + detail + staff + member, lalu
 * memetakan ke nama field yang diharapkan frontend.
 */
export async function listTransaksi(date: string) {
  const rows = await db
    .select({
      pesananId: pesanan.pesananId,
      createdAt: pesanan.createdAt,
      subtotal: pesanan.subtotal,
      serviceCharge: pesanan.serviceCharge,
      pajak: pesanan.pajak,
      total: pesanan.total,
      customerNama: pesanan.customerNama,
      namaStaff: users.namaUser,
      namaMember: member.nama,
      metode: pembayaran.metode,
      jumlahBayar: pembayaran.jumlahBayar,
    })
    .from(pesanan)
    // Inner join: hanya pesanan yang punya pembayaran (= transaksi selesai).
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .innerJoin(users, eq(users.userId, pesanan.userId))
    .leftJoin(member, eq(member.memberId, pesanan.memberId))
    .where(eq(pesanan.tanggal, date))
    .orderBy(desc(pesanan.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.pesananId);
  const details = await db
    .select({
      pesananId: detailPesanan.pesananId,
      jumlah: detailPesanan.jumlah,
      hargaSatuan: detailPesanan.hargaSatuan,
      subtotal: detailPesanan.subtotal,
      namaMenu: menus.namaMenu,
      namaCustom: detailPesanan.namaCustom,
    })
    .from(detailPesanan)
    .leftJoin(menus, eq(menus.menuId, detailPesanan.menuId))
    .where(inArray(detailPesanan.pesananId, ids));

  const itemsByPesanan = new Map<number, TransaksiItem[]>();
  for (const d of details) {
    const list = itemsByPesanan.get(d.pesananId) ?? [];
    list.push({
      nama: d.namaMenu ?? d.namaCustom ?? '',
      hargaSatuan: d.hargaSatuan,
      qty: d.jumlah,
      total: d.subtotal,
    });
    itemsByPesanan.set(d.pesananId, list);
  }

  return rows.map((r) => ({
    kodeTransaksi: `TRX-${String(r.pesananId).padStart(4, '0')}`,
    waktu: r.createdAt.toISOString(),
    namaStaff: r.namaStaff,
    namaKontak: r.customerNama ?? r.namaMember ?? '',
    tipePembayaran: metodeLabel[r.metode] ?? r.metode,
    nominalPembayaran: r.jumlahBayar,
    subtotal: r.subtotal,
    biayaLayananPct: pct(r.serviceCharge, r.subtotal),
    biayaLayanan: r.serviceCharge,
    pajakTokoPct: pct(r.pajak, r.subtotal),
    pajakToko: r.pajak,
    items: itemsByPesanan.get(r.pesananId) ?? [],
    total: r.total,
  }));
}
