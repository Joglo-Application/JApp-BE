import { and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/config/database';
import {
  stokKeluar,
  stokKeluarItem,
  stokMasuk,
  stokMasukItem,
} from '@/db/schema/stok-mutasi';
import { menus } from '@/db/schema/menus';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { users } from '@/db/schema/users';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type {
  CreateStokKeluarInput,
  CreateStokMasukInput,
  RentangQuery,
} from './stok-mutasi.schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface ItemStok {
  sumber: 'inventori' | 'stok_gudang';
  menuId?: number | null;
  bahanId?: number | null;
  nama?: string;
  jumlah: number;
}

/** Nomor dokumen berurutan, mis. SM-001 / SK-001 (format yang dipakai FE). */
async function nextKode(prefix: string, table: typeof stokMasuk | typeof stokKeluar) {
  const [row] = await db.select({ jumlah: count() }).from(table);
  return `${prefix}-${String(Number(row?.jumlah ?? 0) + 1).padStart(3, '0')}`;
}

/**
 * Melengkapi item dengan nama produk dan memvalidasi referensinya ada.
 * Nama disimpan sebagai snapshot supaya riwayat tetap terbaca bila produk
 * kelak dihapus.
 */
async function lengkapiNama(tx: Tx, items: ItemStok[]) {
  const menuIds = items.filter((i) => i.menuId).map((i) => i.menuId as number);
  const bahanIds = items.filter((i) => i.bahanId).map((i) => i.bahanId as number);

  const menuRows = menuIds.length
    ? await tx
        .select({ id: menus.menuId, nama: menus.namaMenu })
        .from(menus)
        .where(inArray(menus.menuId, menuIds))
    : [];
  const bahanRows = bahanIds.length
    ? await tx
        .select({ id: bahanBaku.bahanId, nama: bahanBaku.namaBahan })
        .from(bahanBaku)
        .where(inArray(bahanBaku.bahanId, bahanIds))
    : [];

  const namaMenu = new Map(menuRows.map((r) => [r.id, r.nama]));
  const namaBahan = new Map(bahanRows.map((r) => [r.id, r.nama]));

  return items.map((i) => {
    if (i.sumber === 'inventori') {
      const nama = namaMenu.get(i.menuId as number);
      if (!nama) throw new NotFoundError(`Menu id ${i.menuId} tidak ditemukan`);
      return { ...i, nama };
    }
    const nama = namaBahan.get(i.bahanId as number);
    if (!nama) throw new NotFoundError(`Bahan baku id ${i.bahanId} tidak ditemukan`);
    return { ...i, nama };
  });
}

/**
 * Menerapkan perubahan stok. `arah` 1 untuk menambah (stok masuk) dan -1 untuk
 * mengurangi (stok keluar); pembatalan dokumen memakai arah kebalikannya.
 * Stok tidak boleh menjadi negatif.
 */
async function terapkanStok(tx: Tx, items: ItemStok[], arah: 1 | -1) {
  for (const item of items) {
    const delta = arah * item.jumlah;

    if (item.sumber === 'inventori') {
      const [menu] = await tx
        .select({ stok: menus.stok, nama: menus.namaMenu })
        .from(menus)
        .where(eq(menus.menuId, item.menuId as number))
        .limit(1);
      if (!menu) throw new NotFoundError(`Menu id ${item.menuId} tidak ditemukan`);
      if (menu.stok + delta < 0) {
        throw new ConflictError(
          `Stok "${menu.nama}" tidak mencukupi (tersedia ${menu.stok}, butuh ${item.jumlah})`,
        );
      }
      await tx
        .update(menus)
        .set({ stok: sql`${menus.stok} + ${delta}` })
        .where(eq(menus.menuId, item.menuId as number));
    } else {
      const [bahan] = await tx
        .select({ stok: bahanBaku.stok, nama: bahanBaku.namaBahan })
        .from(bahanBaku)
        .where(eq(bahanBaku.bahanId, item.bahanId as number))
        .limit(1);
      if (!bahan) throw new NotFoundError(`Bahan baku id ${item.bahanId} tidak ditemukan`);
      if (Number(bahan.stok) + delta < 0) {
        throw new ConflictError(
          `Stok "${bahan.nama}" tidak mencukupi (tersedia ${bahan.stok}, butuh ${item.jumlah})`,
        );
      }
      await tx
        .update(bahanBaku)
        .set({ stok: sql`${bahanBaku.stok} + ${delta}` })
        .where(eq(bahanBaku.bahanId, item.bahanId as number));
    }
  }
}

function filterDokumen(
  kolomTanggal: AnyPgColumn,
  kolomStatus: AnyPgColumn,
  query: RentangQuery,
) {
  const kondisi = [];
  if (query.start) kondisi.push(gte(kolomTanggal, query.start));
  if (query.end) kondisi.push(lte(kolomTanggal, query.end));
  if (query.status) kondisi.push(eq(kolomStatus, query.status));
  return kondisi.length ? and(...kondisi) : undefined;
}

// ----------------------------------------------------------- Stok Masuk

export async function listStokMasuk(query: RentangQuery) {
  const rows = await db
    .select({
      stokMasukId: stokMasuk.stokMasukId,
      kode: stokMasuk.kode,
      tanggal: stokMasuk.tanggal,
      supplier: stokMasuk.supplier,
      catatan: stokMasuk.catatan,
      status: stokMasuk.status,
      createdBy: users.namaUser,
    })
    .from(stokMasuk)
    .innerJoin(users, eq(users.userId, stokMasuk.userId))
    .where(filterDokumen(stokMasuk.tanggal, stokMasuk.status, query))
    .orderBy(desc(stokMasuk.stokMasukId));

  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(stokMasukItem)
    .where(inArray(stokMasukItem.stokMasukId, rows.map((r) => r.stokMasukId)));

  return rows.map((r) => ({
    ...r,
    produk: items
      .filter((i) => i.stokMasukId === r.stokMasukId)
      .map((i) => ({
        nama: i.nama,
        sumber: i.sumber,
        menuId: i.menuId,
        bahanId: i.bahanId,
        jumlah: i.jumlah,
      })),
  }));
}

export async function createStokMasuk(userId: number, input: CreateStokMasukInput) {
  const kode = await nextKode('SM', stokMasuk);

  return db.transaction(async (tx) => {
    const items = await lengkapiNama(tx, input.items);

    const [dokumen] = await tx
      .insert(stokMasuk)
      .values({
        kode,
        supplier: input.supplier ?? null,
        catatan: input.catatan ?? null,
        status: input.langsungPosting ? 'posted' : 'draft',
        userId,
      })
      .returning();

    await tx.insert(stokMasukItem).values(
      items.map((i) => ({
        stokMasukId: dokumen.stokMasukId,
        sumber: i.sumber,
        menuId: i.menuId ?? null,
        bahanId: i.bahanId ?? null,
        nama: i.nama as string,
        jumlah: i.jumlah,
      })),
    );

    // Draft sengaja belum menyentuh stok — baru berdampak saat diposting.
    if (input.langsungPosting) await terapkanStok(tx, items, 1);

    return dokumen;
  });
}

export async function postingStokMasuk(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(stokMasuk)
      .where(eq(stokMasuk.stokMasukId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen stok masuk tidak ditemukan');
    if (dokumen.status !== 'draft') {
      throw new ConflictError(`Dokumen berstatus "${dokumen.status}" tidak dapat diposting`);
    }

    const items = await tx
      .select()
      .from(stokMasukItem)
      .where(eq(stokMasukItem.stokMasukId, id));
    await terapkanStok(tx, items as ItemStok[], 1);

    const [updated] = await tx
      .update(stokMasuk)
      .set({ status: 'posted' })
      .where(eq(stokMasuk.stokMasukId, id))
      .returning();
    return updated;
  });
}

export async function batalStokMasuk(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(stokMasuk)
      .where(eq(stokMasuk.stokMasukId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen stok masuk tidak ditemukan');
    if (dokumen.status === 'cancelled') {
      throw new ConflictError('Dokumen sudah dibatalkan');
    }

    // Hanya dokumen yang sudah diposting yang perlu dikembalikan stoknya.
    if (dokumen.status === 'posted') {
      const items = await tx
        .select()
        .from(stokMasukItem)
        .where(eq(stokMasukItem.stokMasukId, id));
      await terapkanStok(tx, items as ItemStok[], -1);
    }

    const [updated] = await tx
      .update(stokMasuk)
      .set({ status: 'cancelled' })
      .where(eq(stokMasuk.stokMasukId, id))
      .returning();
    return updated;
  });
}

// ---------------------------------------------------------- Stok Keluar

export async function listStokKeluar(query: RentangQuery) {
  const rows = await db
    .select({
      stokKeluarId: stokKeluar.stokKeluarId,
      kode: stokKeluar.kode,
      tanggal: stokKeluar.tanggal,
      catatan: stokKeluar.catatan,
      status: stokKeluar.status,
      createdBy: users.namaUser,
    })
    .from(stokKeluar)
    .innerJoin(users, eq(users.userId, stokKeluar.userId))
    .where(filterDokumen(stokKeluar.tanggal, stokKeluar.status, query))
    .orderBy(desc(stokKeluar.stokKeluarId));

  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(stokKeluarItem)
    .where(inArray(stokKeluarItem.stokKeluarId, rows.map((r) => r.stokKeluarId)));

  return rows.map((r) => ({
    ...r,
    produk: items
      .filter((i) => i.stokKeluarId === r.stokKeluarId)
      .map((i) => ({
        nama: i.nama,
        sumber: i.sumber,
        menuId: i.menuId,
        bahanId: i.bahanId,
        harga: i.harga,
        jumlah: i.jumlah,
      })),
  }));
}

export async function createStokKeluar(userId: number, input: CreateStokKeluarInput) {
  const kode = await nextKode('SK', stokKeluar);

  return db.transaction(async (tx) => {
    const items = await lengkapiNama(tx, input.items);

    const [dokumen] = await tx
      .insert(stokKeluar)
      .values({
        kode,
        catatan: input.catatan ?? null,
        status: input.langsungPosting ? 'posted' : 'draft',
        userId,
      })
      .returning();

    await tx.insert(stokKeluarItem).values(
      items.map((i, idx) => ({
        stokKeluarId: dokumen.stokKeluarId,
        sumber: i.sumber,
        menuId: i.menuId ?? null,
        bahanId: i.bahanId ?? null,
        nama: i.nama as string,
        harga: input.items[idx].harga,
        jumlah: i.jumlah,
      })),
    );

    if (input.langsungPosting) await terapkanStok(tx, items, -1);

    return dokumen;
  });
}

export async function postingStokKeluar(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(stokKeluar)
      .where(eq(stokKeluar.stokKeluarId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen stok keluar tidak ditemukan');
    if (dokumen.status !== 'draft') {
      throw new ConflictError(`Dokumen berstatus "${dokumen.status}" tidak dapat diposting`);
    }

    const items = await tx
      .select()
      .from(stokKeluarItem)
      .where(eq(stokKeluarItem.stokKeluarId, id));
    await terapkanStok(tx, items as ItemStok[], -1);

    const [updated] = await tx
      .update(stokKeluar)
      .set({ status: 'posted' })
      .where(eq(stokKeluar.stokKeluarId, id))
      .returning();
    return updated;
  });
}

export async function batalStokKeluar(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(stokKeluar)
      .where(eq(stokKeluar.stokKeluarId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen stok keluar tidak ditemukan');
    if (dokumen.status === 'cancelled') {
      throw new ConflictError('Dokumen sudah dibatalkan');
    }

    if (dokumen.status === 'posted') {
      const items = await tx
        .select()
        .from(stokKeluarItem)
        .where(eq(stokKeluarItem.stokKeluarId, id));
      await terapkanStok(tx, items as ItemStok[], 1);
    }

    const [updated] = await tx
      .update(stokKeluar)
      .set({ status: 'cancelled' })
      .where(eq(stokKeluar.stokKeluarId, id))
      .returning();
    return updated;
  });
}
