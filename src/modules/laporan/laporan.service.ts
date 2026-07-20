import { and, asc, count, desc, eq, gte, isNotNull, isNull, lte, sql, sum } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { pembayaran } from '@/db/schema/pembayaran';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { meja } from '@/db/schema/meja';
import { transaksiBahanMasuk } from '@/db/schema/transaksi-bahan-masuk';
import { memberPoinLog } from '@/db/schema/member-poin-log';
import type { RentangQuery } from './laporan.schema';

/** Angka dari hasil agregasi Drizzle (string | null) → number. */
function n(value: unknown): number {
  return Number(value ?? 0);
}

function hariIni(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normalisasi rentang: kosong = hari ini, salah satu kosong = satu hari. */
export function resolveRentang(query: RentangQuery) {
  const start = query.start ?? query.end ?? hariIni();
  const end = query.end ?? query.start ?? hariIni();
  return { start, end };
}

/** Filter tanggal pesanan dalam rentang. */
function dalamRentang(start: string, end: string) {
  return and(gte(pesanan.tanggal, start), lte(pesanan.tanggal, end));
}

/** Label metode pembayaran sesuai tampilan frontend. */
const metodeLabel: Record<string, string> = {
  cash: 'TUNAI',
  qris: 'QRIS',
  qris_netzme: 'QRIS',
  debit: 'DEBIT',
  transfer: 'TRANSFER',
};

/**
 * Ringkasan penutupan penjualan: pendapatan, pengeluaran, retur, dan
 * pencacahan pesanan. Hanya transaksi berbayar (punya baris pembayaran)
 * yang dihitung sebagai penjualan.
 */
export async function ringkasan(query: RentangQuery) {
  const { start, end } = resolveRentang(query);

  const [terjual] = await db
    .select({
      jumlahTransaksi: count(),
      subtotal: sum(pesanan.subtotal),
      biayaLayanan: sum(pesanan.serviceCharge),
      pajak: sum(pesanan.pajak),
      diskon: sum(pesanan.diskon),
      total: sum(pesanan.total),
    })
    .from(pesanan)
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .where(and(dalamRentang(start, end), isNull(pesanan.returAt)));

  const [retur] = await db
    .select({ jumlah: count(), total: sum(pesanan.total) })
    .from(pesanan)
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .where(and(dalamRentang(start, end), isNotNull(pesanan.returAt)));

  const [dibatalkan] = await db
    .select({ jumlah: count() })
    .from(pesanan)
    .where(and(dalamRentang(start, end), eq(pesanan.status, 'cancelled')));

  const [pengeluaran] = await db
    .select({ total: sum(transaksiBahanMasuk.subtotal) })
    .from(transaksiBahanMasuk)
    .where(
      and(gte(transaksiBahanMasuk.tanggal, start), lte(transaksiBahanMasuk.tanggal, end)),
    );

  const poinRows = await db
    .select({ tipe: memberPoinLog.tipe, poin: sum(memberPoinLog.poin) })
    .from(memberPoinLog)
    .where(and(gte(memberPoinLog.tanggal, start), lte(memberPoinLog.tanggal, end)))
    .groupBy(memberPoinLog.tipe);

  const poinTerkumpul = n(poinRows.find((r) => r.tipe === 'earn')?.poin);
  const poinDitukar = n(poinRows.find((r) => r.tipe === 'redeem')?.poin);

  const pendapatan = n(terjual?.total);
  const totalPengeluaran = n(pengeluaran?.total);
  const totalRetur = n(retur?.total);

  return {
    rentang: { start, end },
    pendapatan,
    pengeluaran: totalPengeluaran,
    retur: totalRetur,
    // Bersih = pendapatan dikurangi retur dan pengeluaran pembelian bahan.
    pendapatanBersih: pendapatan - totalRetur - totalPengeluaran,
    rincian: {
      subtotal: n(terjual?.subtotal),
      biayaLayanan: n(terjual?.biayaLayanan),
      pajak: n(terjual?.pajak),
      diskon: n(terjual?.diskon),
    },
    pesanan: {
      diterima: n(terjual?.jumlahTransaksi),
      diretur: n(retur?.jumlah),
      dibatalkan: n(dibatalkan?.jumlah),
    },
    loyalty: { poinTerkumpul, poinDitukar },
  };
}

/** Penjualan per produk + agregat per kategori. */
export async function produk(query: RentangQuery) {
  const { start, end } = resolveRentang(query);

  const namaExpr = sql<string>`coalesce(${menus.namaMenu}, ${detailPesanan.namaCustom}, '-')`;
  const kategoriExpr = sql<string>`coalesce(${menus.kategori}, 'Lainnya')`;

  const rows = await db
    .select({
      nama: namaExpr,
      kategori: kategoriExpr,
      qty: sum(detailPesanan.jumlah),
      omzet: sum(detailPesanan.subtotal),
    })
    .from(detailPesanan)
    .innerJoin(pesanan, eq(pesanan.pesananId, detailPesanan.pesananId))
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .leftJoin(menus, eq(menus.menuId, detailPesanan.menuId))
    .where(and(dalamRentang(start, end), isNull(pesanan.returAt)))
    .groupBy(namaExpr, kategoriExpr)
    .orderBy(desc(sum(detailPesanan.subtotal)));

  const items = rows.map((r) => ({
    nama: r.nama,
    kategori: r.kategori,
    qty: n(r.qty),
    omzet: n(r.omzet),
  }));

  const perKategori = new Map<string, { kategori: string; qty: number; omzet: number }>();
  for (const item of items) {
    const agg = perKategori.get(item.kategori) ?? { kategori: item.kategori, qty: 0, omzet: 0 };
    agg.qty += item.qty;
    agg.omzet += item.omzet;
    perKategori.set(item.kategori, agg);
  }

  return {
    rentang: { start, end },
    items,
    kategori: [...perKategori.values()].sort((a, b) => b.omzet - a.omzet),
    totalQty: items.reduce((s, i) => s + i.qty, 0),
    totalOmzet: items.reduce((s, i) => s + i.omzet, 0),
  };
}

/** Agregat transaksi per metode pembayaran. */
export async function perPembayaran(query: RentangQuery) {
  const { start, end } = resolveRentang(query);

  const rows = await db
    .select({
      metode: pembayaran.metode,
      jumlahTransaksi: count(),
      total: sum(pesanan.total),
    })
    .from(pembayaran)
    .innerJoin(pesanan, eq(pesanan.pesananId, pembayaran.pesananId))
    .where(and(dalamRentang(start, end), isNull(pesanan.returAt)))
    .groupBy(pembayaran.metode);

  // Metode `qris` dan `qris_netzme` tampil sebagai satu baris "QRIS".
  const gabung = new Map<string, { metode: string; jumlahTransaksi: number; total: number }>();
  for (const r of rows) {
    const label = metodeLabel[r.metode] ?? r.metode.toUpperCase();
    const agg = gabung.get(label) ?? { metode: label, jumlahTransaksi: 0, total: 0 };
    agg.jumlahTransaksi += n(r.jumlahTransaksi);
    agg.total += n(r.total);
    gabung.set(label, agg);
  }

  const items = [...gabung.values()].sort((a, b) => b.total - a.total);
  return {
    rentang: { start, end },
    items,
    total: items.reduce((s, i) => s + i.total, 0),
  };
}

/** Jumlah tamu per zona/area meja (laporan Guest Resto). */
export async function guest(query: RentangQuery) {
  const { start, end } = resolveRentang(query);

  const zonaExpr = sql<string>`coalesce(${meja.zona}, 'Tanpa Area')`;

  const rows = await db
    .select({
      zona: zonaExpr,
      jumlahTamu: sum(pesanan.jumlahTamu),
      jumlahTransaksi: count(),
    })
    .from(pesanan)
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .leftJoin(meja, eq(meja.mejaId, pesanan.mejaId))
    .where(and(dalamRentang(start, end), isNull(pesanan.returAt)))
    .groupBy(zonaExpr);

  const items = rows
    .map((r) => ({
      zona: r.zona,
      jumlahTamu: n(r.jumlahTamu),
      jumlahTransaksi: n(r.jumlahTransaksi),
    }))
    .sort((a, b) => b.jumlahTamu - a.jumlahTamu);

  return {
    rentang: { start, end },
    items,
    totalTamu: items.reduce((s, i) => s + i.jumlahTamu, 0),
  };
}

/**
 * Data dashboard owner: ringkasan + deret harian + top kategori/produk.
 * Satu panggilan menggantikan 7 request `GET /transaksi` paralel yang
 * sebelumnya dipakai frontend untuk menggambar grafik mingguan.
 */
export async function dashboard(query: RentangQuery) {
  const { start, end } = resolveRentang(query);

  const [ringkas, produkData] = await Promise.all([
    ringkasan(query),
    produk(query),
  ]);

  const penjualanHarian = await db
    .select({
      tanggal: pesanan.tanggal,
      total: sum(pesanan.total),
      jumlahTransaksi: count(),
    })
    .from(pesanan)
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .where(and(dalamRentang(start, end), isNull(pesanan.returAt)))
    .groupBy(pesanan.tanggal)
    .orderBy(asc(pesanan.tanggal));

  const pengeluaranHarian = await db
    .select({
      tanggal: transaksiBahanMasuk.tanggal,
      total: sum(transaksiBahanMasuk.subtotal),
    })
    .from(transaksiBahanMasuk)
    .where(and(gte(transaksiBahanMasuk.tanggal, start), lte(transaksiBahanMasuk.tanggal, end)))
    .groupBy(transaksiBahanMasuk.tanggal)
    .orderBy(asc(transaksiBahanMasuk.tanggal));

  const pengeluaranMap = new Map(pengeluaranHarian.map((r) => [r.tanggal, n(r.total)]));

  return {
    rentang: { start, end },
    ringkasan: ringkas,
    harian: penjualanHarian.map((r) => ({
      tanggal: r.tanggal,
      pendapatan: n(r.total),
      pengeluaran: pengeluaranMap.get(r.tanggal) ?? 0,
      jumlahTransaksi: n(r.jumlahTransaksi),
    })),
    topProduk: produkData.items.slice(0, 5),
    topKategori: produkData.kategori.slice(0, 5),
  };
}

/** Escape satu sel CSV. */
function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/**
 * Export laporan sebagai CSV (dibuka langsung oleh Excel) — dipilih agar
 * tidak menambah dependensi pembuat XLSX di server.
 */
export async function exportLaporan(jenis: string, query: RentangQuery) {
  const { start, end } = resolveRentang(query);

  if (jenis === 'produk') {
    const data = await produk(query);
    return {
      filename: `laporan-produk-${start}-sd-${end}.csv`,
      csv: toCsv(
        ['Produk', 'Kategori', 'Qty', 'Omzet'],
        data.items.map((i) => [i.nama, i.kategori, i.qty, i.omzet]),
      ),
    };
  }

  if (jenis === 'pembayaran') {
    const data = await perPembayaran(query);
    return {
      filename: `laporan-pembayaran-${start}-sd-${end}.csv`,
      csv: toCsv(
        ['Metode', 'Jumlah Transaksi', 'Total'],
        data.items.map((i) => [i.metode, i.jumlahTransaksi, i.total]),
      ),
    };
  }

  if (jenis === 'guest') {
    const data = await guest(query);
    return {
      filename: `laporan-guest-${start}-sd-${end}.csv`,
      csv: toCsv(
        ['Area', 'Jumlah Tamu', 'Jumlah Transaksi'],
        data.items.map((i) => [i.zona, i.jumlahTamu, i.jumlahTransaksi]),
      ),
    };
  }

  const data = await ringkasan(query);
  return {
    filename: `laporan-ringkasan-${start}-sd-${end}.csv`,
    csv: toCsv(
      ['Keterangan', 'Nilai'],
      [
        ['Pendapatan', data.pendapatan],
        ['Pengeluaran', data.pengeluaran],
        ['Retur', data.retur],
        ['Pendapatan Bersih', data.pendapatanBersih],
        ['Subtotal', data.rincian.subtotal],
        ['Biaya Layanan', data.rincian.biayaLayanan],
        ['Pajak', data.rincian.pajak],
        ['Diskon', data.rincian.diskon],
        ['Pesanan Diterima', data.pesanan.diterima],
        ['Pesanan Diretur', data.pesanan.diretur],
        ['Pesanan Dibatalkan', data.pesanan.dibatalkan],
        ['Poin Terkumpul', data.loyalty.poinTerkumpul],
        ['Poin Ditukar', data.loyalty.poinDitukar],
      ],
    ),
  };
}
