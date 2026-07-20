import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { pembayaran } from '@/db/schema/pembayaran';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { users } from '@/db/schema/users';
import { member } from '@/db/schema/member';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { transaksiBahanKeluar } from '@/db/schema/transaksi-bahan-keluar';
import { logTransaksi } from '@/db/schema/log-transaksi';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { verifyPin } from '../auth/auth.service';
import { kembalikanStokMenu } from '../pesanan/pesanan.service';
import type { ReturTransaksiInput } from './transaksi.schema';

/** Label metode pembayaran sesuai yang ditampilkan frontend. */
const metodeLabel: Record<string, string> = {
  cash: 'TUNAI',
  qris: 'QRIS',
  qris_netzme: 'QRIS',
  debit: 'Debit',
  transfer: 'Transfer',
};

/** Kode transaksi yang ditampilkan frontend. */
export function kodeTransaksi(pesananId: number): string {
  return `TRX-${String(pesananId).padStart(4, '0')}`;
}

/** Pembulatan numeric ke skala 3 desimal sesuai kolom DB stok. */
function toQty(value: number): string {
  return value.toFixed(3);
}

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
      returAt: pesanan.returAt,
      returAlasan: pesanan.returAlasan,
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
    pesananId: r.pesananId,
    kodeTransaksi: kodeTransaksi(r.pesananId),
    isReturned: r.returAt !== null,
    alasanRetur: r.returAlasan,
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

/**
 * Retur (pengembalian) transaksi yang sudah dibayar. Mengembalikan stok bahan
 * baku yang dipotong saat pesanan dibuat, menandai pesanan sebagai retur, dan
 * mencatat aksi ke audit log. Wajib disetujui PIN supervisor karena mengubah
 * stok dan nilai penjualan.
 */
export async function returTransaksi(
  actorUserId: number,
  pesananId: number,
  input: ReturTransaksiInput,
) {
  const approver = await verifyPin({ pin: input.pin });

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(pesanan)
      .where(eq(pesanan.pesananId, pesananId))
      .limit(1);
    if (!row) throw new NotFoundError('Transaksi tidak ditemukan');
    if (row.returAt) throw new ConflictError('Transaksi sudah diretur');

    const [bayar] = await tx
      .select({ pembayaranId: pembayaran.pembayaranId })
      .from(pembayaran)
      .where(eq(pembayaran.pesananId, pesananId))
      .limit(1);
    if (!bayar) {
      throw new ConflictError('Hanya transaksi yang sudah dibayar dapat diretur');
    }

    // Kembalikan stok bahan yang sebelumnya dipotong sebagai penjualan.
    const saleLogs = await tx
      .select()
      .from(transaksiBahanKeluar)
      .where(eq(transaksiBahanKeluar.pesananId, pesananId));

    for (const log of saleLogs.filter((l) => l.tipeKeluar === 'sale')) {
      const [bahan] = await tx
        .select()
        .from(bahanBaku)
        .where(eq(bahanBaku.bahanId, log.bahanId))
        .limit(1);
      if (bahan) {
        await tx
          .update(bahanBaku)
          .set({ stok: toQty(Number(bahan.stok) + Number(log.jumlah)) })
          .where(eq(bahanBaku.bahanId, log.bahanId));
      }
      await tx.insert(transaksiBahanKeluar).values({
        bahanId: log.bahanId,
        jumlah: toQty(-Number(log.jumlah)),
        tipeKeluar: 'adjustment',
        keterangan: `Retur transaksi #${pesananId} (pengembalian stok)`,
        pesananId,
        userId: actorUserId,
      });
    }

    // Menu tanpa resep: stok dikelola di level menu, kembalikan juga.
    await kembalikanStokMenu(tx, pesananId);

    const kode = kodeTransaksi(pesananId);
    const [updated] = await tx
      .update(pesanan)
      .set({
        returAt: new Date(),
        returAlasan: input.alasan,
        returUserId: approver.userId,
      })
      .where(eq(pesanan.pesananId, pesananId))
      .returning();

    await tx.insert(logTransaksi).values({
      tipe: 'RETUR',
      kodeTransaksi: kode,
      deskripsi: `Retur ${kode}: ${input.alasan} (disetujui ${approver.namaUser})`,
      userId: actorUserId,
    });

    return {
      kodeTransaksi: kode,
      isReturned: true,
      alasanRetur: updated?.returAlasan ?? input.alasan,
      disetujuiOleh: approver,
    };
  });
}
