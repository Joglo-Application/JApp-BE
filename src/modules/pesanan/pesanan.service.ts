import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/config/database';
import { pesanan } from '@/db/schema/pesanan';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { resepMenu } from '@/db/schema/resep-menu';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { transaksiBahanKeluar } from '@/db/schema/transaksi-bahan-keluar';
import { pembayaran } from '@/db/schema/pembayaran';
import { meja } from '@/db/schema/meja';
import { member } from '@/db/schema/member';
import { users } from '@/db/schema/users';
import { getGrup as getGrupPengaturan } from '../pengaturan/pengaturan.service';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type { CreatePesananInput, ListPesananQuery, OrderDiscountInput } from './pesanan.schema';

/** Pembulatan numeric ke skala 3 desimal sesuai kolom DB stok. */
function toQty(value: number): string {
  return value.toFixed(3);
}

/** Tipe transaksi Drizzle, agar helper bisa dipakai lintas modul. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Mengembalikan stok level menu (menu tanpa resep) berdasarkan detail pesanan.
 * Pasangan dari pemotongan di langkah 4b `createPesanan`; dipakai saat
 * pembatalan pesanan dan retur transaksi.
 */
export async function kembalikanStokMenu(tx: Tx, pesananId: number) {
  const details = await tx
    .select({ menuId: detailPesanan.menuId, jumlah: detailPesanan.jumlah })
    .from(detailPesanan)
    .where(eq(detailPesanan.pesananId, pesananId));

  const menuIds = [
    ...new Set(details.map((d) => d.menuId).filter((id): id is number => id !== null)),
  ];
  if (menuIds.length === 0) return;

  const reseps = await tx
    .select({ menuId: resepMenu.menuId })
    .from(resepMenu)
    .where(inArray(resepMenu.menuId, menuIds));
  const punyaResep = new Set(reseps.map((r) => r.menuId));

  // Hanya menu ber-`trackStok` yang stoknya dipotong saat penjualan.
  const tracked = await tx
    .select({ menuId: menus.menuId })
    .from(menus)
    .where(and(inArray(menus.menuId, menuIds), eq(menus.trackStok, true)));
  const dilacak = new Set(tracked.map((m) => m.menuId));

  for (const d of details) {
    if (d.menuId === null || punyaResep.has(d.menuId) || !dilacak.has(d.menuId)) continue;
    await tx
      .update(menus)
      .set({ stok: sql`${menus.stok} + ${d.jumlah}` })
      .where(eq(menus.menuId, d.menuId));
  }
}

/** Hitung nominal diskon pesanan dari subtotal. */
function computeOrderDiscount(subtotal: number, diskon?: OrderDiscountInput): number {
  if (!diskon || diskon.nilai <= 0) return 0;
  if (diskon.tipe === 'percent') {
    return Math.min(subtotal, Math.round(subtotal * (diskon.nilai / 100)));
  }
  return Math.min(subtotal, Math.round(diskon.nilai));
}

/**
 * Membuat pesanan baru. Mendukung item menu (memotong stok via resep) maupun
 * item custom (ad-hoc, tanpa stok). Menghitung subtotal, biaya layanan, pajak,
 * diskon, dan total secara server-side. Atomik dalam satu transaksi DB.
 */
export async function createPesanan(userId: number, input: CreatePesananInput) {
  const newId = await db.transaction(async (tx) => {
    // Draft "held" (parkir): tidak potong stok, tidak masuk dapur.
    const isHold = input.hold === true;

    // 1. Validasi relasi opsional
    if (input.mejaId !== undefined) {
      const [m] = await tx
        .select({ id: meja.mejaId })
        .from(meja)
        .where(eq(meja.mejaId, input.mejaId))
        .limit(1);
      if (!m) throw new NotFoundError('Meja tidak ditemukan');

      // Satu meja hanya boleh punya SATU transaksi aktif (in_progress).
      // Draft held dikecualikan (belum benar-benar menempati meja).
      if (!isHold) {
        const [busy] = await tx
          .select({ id: pesanan.pesananId })
          .from(pesanan)
          .where(and(eq(pesanan.mejaId, input.mejaId), eq(pesanan.status, 'in_progress')))
          .limit(1);
        if (busy) {
          throw new ConflictError(
            `Meja sedang dipakai (pesanan #${busy.id}). Selesaikan dulu pesanan tersebut.`,
          );
        }
      }
    }
    if (input.memberId !== undefined) {
      const [m] = await tx
        .select({ id: member.memberId })
        .from(member)
        .where(eq(member.memberId, input.memberId))
        .limit(1);
      if (!m) throw new NotFoundError('Member tidak ditemukan');
    }

    // 2. Validasi menu (hanya item yang punya menuId)
    const menuIds = [
      ...new Set(input.items.filter((i) => i.menuId !== undefined).map((i) => i.menuId as number)),
    ];
    const menuRows = menuIds.length
      ? await tx.select().from(menus).where(inArray(menus.menuId, menuIds))
      : [];
    const menuMap = new Map(menuRows.map((m) => [m.menuId, m]));

    for (const item of input.items) {
      if (item.menuId !== undefined) {
        const menu = menuMap.get(item.menuId);
        if (!menu) throw new NotFoundError(`Menu id ${item.menuId} tidak ditemukan`);
        if (!menu.isActive) throw new BadRequestError(`Menu "${menu.namaMenu}" sedang tidak aktif`);
      }
    }

    // 3. Agregasi kebutuhan bahan baku dari resep (hanya item menu)
    const reseps = menuIds.length
      ? await tx.select().from(resepMenu).where(inArray(resepMenu.menuId, menuIds))
      : [];
    const resepByMenu = new Map<number, typeof reseps>();
    for (const r of reseps) {
      const arr = resepByMenu.get(r.menuId) ?? [];
      arr.push(r);
      resepByMenu.set(r.menuId, arr);
    }

    // Draft held belum dimasak → jangan hitung/potong stok.
    const required = new Map<number, number>();
    if (!isHold) {
      for (const item of input.items) {
        if (item.menuId === undefined) continue;
        for (const r of resepByMenu.get(item.menuId) ?? []) {
          const need = Number(r.jumlahPakai) * item.jumlah;
          required.set(r.bahanId, (required.get(r.bahanId) ?? 0) + need);
        }
      }
    }

    // 4. Cek & potong stok
    if (required.size > 0) {
      const bahanIds = [...required.keys()];
      const bahanRows = await tx
        .select()
        .from(bahanBaku)
        .where(inArray(bahanBaku.bahanId, bahanIds));
      const bahanMap = new Map(bahanRows.map((b) => [b.bahanId, b]));

      for (const [bahanId, need] of required) {
        const bahan = bahanMap.get(bahanId);
        if (!bahan) throw new NotFoundError(`Bahan baku id ${bahanId} tidak ditemukan`);
        const current = Number(bahan.stok);
        if (current < need) {
          throw new ConflictError(
            `Stok "${bahan.namaBahan}" tidak mencukupi (tersedia ${current}, butuh ${need})`,
          );
        }
      }
      for (const [bahanId, need] of required) {
        const bahan = bahanMap.get(bahanId)!;
        await tx
          .update(bahanBaku)
          .set({ stok: toQty(Number(bahan.stok) - need) })
          .where(eq(bahanBaku.bahanId, bahanId));
      }
    }

    // 4b. Menu tanpa resep tidak punya bahan baku untuk dipotong, jadi stoknya
    // dikelola di level menu (`menus.stok`). Tanpa ini produk jadi (mis. minuman
    // botolan) bisa terjual tanpa batas dan angka di Inventori tidak pernah turun.
    // Hanya berlaku bila menu ditandai `trackStok` — menu lama tidak terpengaruh.
    const menuQty = new Map<number, number>();
    if (!isHold) {
      for (const item of input.items) {
        if (item.menuId === undefined) continue;
        if ((resepByMenu.get(item.menuId) ?? []).length > 0) continue;
        if (!menuMap.get(item.menuId)?.trackStok) continue;
        menuQty.set(item.menuId, (menuQty.get(item.menuId) ?? 0) + item.jumlah);
      }
    }
    for (const [menuId, qty] of menuQty) {
      const menu = menuMap.get(menuId)!;
      if (menu.stok < qty) {
        throw new ConflictError(
          `Stok "${menu.namaMenu}" tidak mencukupi (tersedia ${menu.stok}, butuh ${qty})`,
        );
      }
    }
    for (const [menuId, qty] of menuQty) {
      await tx
        .update(menus)
        .set({ stok: sql`${menus.stok} - ${qty}` })
        .where(eq(menus.menuId, menuId));
    }

    // 5. Hitung rincian uang
    let subtotal = 0;
    const detailValues = input.items.map((item) => {
      const hargaSatuan =
        item.menuId !== undefined ? menuMap.get(item.menuId)!.harga : (item.hargaSatuan as number);
      const diskonItem = item.diskon ?? 0;
      const sub = Math.max(0, hargaSatuan * item.jumlah - diskonItem);
      subtotal += sub;
      return {
        menuId: item.menuId ?? null,
        namaCustom: item.menuId === undefined ? (item.namaCustom ?? null) : null,
        jumlah: item.jumlah,
        hargaSatuan,
        diskon: diskonItem,
        subtotal: sub,
        catatan: item.catatan ?? null,
      };
    });

    // Pajak & Biaya Layanan = default toko yang tersimpan (grup 'pajak'), diubah
    // lewat POS (PIN supervisor) atau layar Pengaturan Pajak: 'percent' = % dari
    // subtotal, 'amount' = nominal Rupiah tetap.
    const pajakSetting = await getGrupPengaturan('pajak');
    const serviceCharge = pajakSetting.biayaLayananAktif
      ? pajakSetting.biayaLayananTipe === 'amount'
        ? Math.round(pajakSetting.biayaLayananNominal)
        : Math.round(subtotal * (pajakSetting.biayaLayananPersen / 100))
      : 0;
    const pajak = pajakSetting.pajakAktif
      ? pajakSetting.pajakTipe === 'amount'
        ? Math.round(pajakSetting.pajakNominal)
        : Math.round(subtotal * (pajakSetting.pajakPersen / 100))
      : 0;
    const diskon = computeOrderDiscount(subtotal, input.diskon);
    const total = subtotal + serviceCharge + pajak - diskon;

    // 6. Simpan pesanan + detail
    const [created] = await tx
      .insert(pesanan)
      .values({
        userId,
        jumlahTamu: input.jumlahTamu ?? null,
        status: isHold ? 'pending' : 'in_progress',
        subtotal,
        serviceCharge,
        pajak,
        diskon,
        diskonTipe: input.diskon?.tipe ?? null,
        diskonNilai: input.diskon ? String(input.diskon.nilai) : null,
        promoNama: input.diskon?.promoNama ?? null,
        total,
        orderType: input.orderType ?? null,
        customerNama: input.customerNama ?? null,
        catatan: input.catatan ?? null,
        mejaId: input.mejaId ?? null,
        memberId: input.memberId ?? null,
      })
      .returning();

    await tx
      .insert(detailPesanan)
      .values(detailValues.map((d) => ({ ...d, pesananId: created.pesananId })));

    // 7. Catat transaksi bahan keluar (penjualan)
    if (required.size > 0) {
      await tx.insert(transaksiBahanKeluar).values(
        [...required].map(([bahanId, need]) => ({
          bahanId,
          jumlah: toQty(need),
          tipeKeluar: 'sale' as const,
          keterangan: `Penjualan pesanan #${created.pesananId}`,
          pesananId: created.pesananId,
          userId,
        })),
      );
    }

    return created.pesananId;
  });

  return getPesananById(newId);
}

export async function listPesanan(query: ListPesananQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const conditions = [];
  if (query.status) conditions.push(eq(pesanan.status, query.status));
  if (query.mejaId !== undefined) conditions.push(eq(pesanan.mejaId, query.mejaId));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(pesanan)
      .where(whereClause)
      .orderBy(desc(pesanan.pesananId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(pesanan).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getPesananById(id: number) {
  const [row] = await db.select().from(pesanan).where(eq(pesanan.pesananId, id)).limit(1);
  if (!row) throw new NotFoundError('Pesanan tidak ditemukan');

  const items = await db
    .select({
      detailId: detailPesanan.detailId,
      menuId: detailPesanan.menuId,
      namaCustom: detailPesanan.namaCustom,
      namaMenu: menus.namaMenu,
      jumlah: detailPesanan.jumlah,
      hargaSatuan: detailPesanan.hargaSatuan,
      diskon: detailPesanan.diskon,
      subtotal: detailPesanan.subtotal,
      catatan: detailPesanan.catatan,
    })
    .from(detailPesanan)
    .leftJoin(menus, eq(detailPesanan.menuId, menus.menuId))
    .where(eq(detailPesanan.pesananId, id));

  const [bayar] = await db.select().from(pembayaran).where(eq(pembayaran.pesananId, id)).limit(1);

  return { ...row, items, pembayaran: bayar ?? null };
}

/**
 * Payload struk untuk dicetak: identitas toko, kasir, meja, rincian item, dan
 * pembayaran. Menggantikan tombol "Cetak" di POS yang sebelumnya tanpa aksi.
 */
export async function getStruk(id: number) {
  const data = await getPesananById(id);

  const [kasir] = await db
    .select({ namaUser: users.namaUser })
    .from(users)
    .where(eq(users.userId, data.userId))
    .limit(1);

  const mejaRow = data.mejaId
    ? await db
        .select({ nomor: meja.nomor, zona: meja.zona })
        .from(meja)
        .where(eq(meja.mejaId, data.mejaId))
        .limit(1)
    : [];

  const toko = await getGrupPengaturan('toko');

  return {
    toko,
    kodeTransaksi: `TRX-${String(data.pesananId).padStart(4, '0')}`,
    waktu: data.createdAt.toISOString(),
    kasir: kasir?.namaUser ?? '',
    meja: mejaRow[0]?.nomor ?? null,
    zona: mejaRow[0]?.zona ?? null,
    orderType: data.orderType,
    customerNama: data.customerNama,
    jumlahTamu: data.jumlahTamu,
    catatan: data.catatan,
    items: data.items.map((i) => ({
      nama: i.namaMenu ?? i.namaCustom ?? '',
      qty: i.jumlah,
      hargaSatuan: i.hargaSatuan,
      diskon: i.diskon,
      subtotal: i.subtotal,
      catatan: i.catatan,
    })),
    subtotal: data.subtotal,
    biayaLayanan: data.serviceCharge,
    pajak: data.pajak,
    diskon: data.diskon,
    promoNama: data.promoNama,
    total: data.total,
    pembayaran: data.pembayaran
      ? {
          metode: data.pembayaran.metode,
          jumlahBayar: data.pembayaran.jumlahBayar,
          kembalian: data.pembayaran.kembalian,
        }
      : null,
    isReturned: data.returAt !== null,
  };
}

/**
 * Membatalkan pesanan `pending` dan mengembalikan stok bahan yang sebelumnya
 * dipotong (dicatat sebagai `adjustment` dengan jumlah negatif).
 */
export async function cancelPesanan(userId: number, id: number) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(pesanan).where(eq(pesanan.pesananId, id)).limit(1);
    if (!row) throw new NotFoundError('Pesanan tidak ditemukan');
    if (row.status !== 'in_progress') {
      throw new ConflictError(`Pesanan dengan status "${row.status}" tidak dapat dibatalkan`);
    }

    const saleLogs = await tx
      .select()
      .from(transaksiBahanKeluar)
      .where(eq(transaksiBahanKeluar.pesananId, id));

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
        keterangan: `Pembatalan pesanan #${id} (pengembalian stok)`,
        pesananId: id,
        userId,
      });
    }

    await kembalikanStokMenu(tx, id);

    const [updated] = await tx
      .update(pesanan)
      .set({ status: 'cancelled' })
      .where(eq(pesanan.pesananId, id))
      .returning();

    return updated;
  });
}

/**
 * Menghapus draft (dipakai saat draft di-Pilih/Gabung kembali ke POS, agar
 * tidak dobel). Hanya pesanan berstatus `pending` (draft) yang boleh dihapus —
 * pesanan nyata (in_progress/completed/cancelled) tidak.
 */
export async function deletePesanan(id: number) {
  const [row] = await db.select().from(pesanan).where(eq(pesanan.pesananId, id)).limit(1);
  if (!row) throw new NotFoundError('Pesanan tidak ditemukan');
  if (row.status !== 'pending') {
    throw new BadRequestError('Hanya pesanan draft (pending) yang dapat dihapus');
  }
  // detail_pesanan ON DELETE CASCADE; draft tidak punya pembayaran/stok keluar.
  await db.delete(pesanan).where(eq(pesanan.pesananId, id));
}

/**
 * Pindah meja: memindahkan pesanan aktif ke meja lain. Meng-update `mejaId`
 * pesanan, menandai meja tujuan `occupied` dan meja asal `available` — atomik.
 */
export async function pindahMeja(pesananId: number, newMejaId: number) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(pesanan).where(eq(pesanan.pesananId, pesananId)).limit(1);
    if (!p) throw new NotFoundError('Pesanan tidak ditemukan');
    if (p.status !== 'in_progress') {
      throw new BadRequestError('Hanya pesanan aktif yang dapat dipindah meja');
    }

    const [m] = await tx
      .select({ id: meja.mejaId })
      .from(meja)
      .where(eq(meja.mejaId, newMejaId))
      .limit(1);
    if (!m) throw new NotFoundError('Meja tujuan tidak ditemukan');

    const oldMejaId = p.mejaId;
    if (oldMejaId === newMejaId) return p;

    // Meja tujuan tidak boleh sudah dipakai pesanan aktif lain.
    const [busy] = await tx
      .select({ id: pesanan.pesananId })
      .from(pesanan)
      .where(and(eq(pesanan.mejaId, newMejaId), eq(pesanan.status, 'in_progress')))
      .limit(1);
    if (busy) {
      throw new ConflictError(
        `Meja tujuan sedang dipakai (pesanan #${busy.id}). Selesaikan dulu pesanan tersebut.`,
      );
    }

    const [updated] = await tx
      .update(pesanan)
      .set({ mejaId: newMejaId })
      .where(eq(pesanan.pesananId, pesananId))
      .returning();

    // Sinkronkan status meja: tujuan terisi, asal kosong.
    await tx.update(meja).set({ status: 'occupied' }).where(eq(meja.mejaId, newMejaId));
    if (oldMejaId !== null) {
      await tx.update(meja).set({ status: 'available' }).where(eq(meja.mejaId, oldMejaId));
    }

    return updated;
  });
}
