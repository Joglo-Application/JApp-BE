import { and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/config/database';
import {
  produksiStok,
  produksiStokItem,
  stokOpname,
  stokOpnameItem,
} from '@/db/schema/stok-dokumen';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { menus } from '@/db/schema/menus';
import { users } from '@/db/schema/users';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type {
  CreateOpnameInput,
  CreateProduksiInput,
  RentangQuery,
} from './stok-dokumen.schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Pembulatan numeric ke skala 3 desimal sesuai kolom DB stok. */
function toQty(value: number): string {
  return value.toFixed(3);
}

/** Nomor dokumen berurutan, mis. SO-001 / PS-001 (format yang dipakai FE). */
async function nextKode(prefix: string, table: typeof stokOpname | typeof produksiStok) {
  const [row] = await db.select({ jumlah: count() }).from(table);
  return `${prefix}-${String(Number(row?.jumlah ?? 0) + 1).padStart(3, '0')}`;
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

// ---------------------------------------------------------- Stok Opname

export async function listOpname(query: RentangQuery) {
  const rows = await db
    .select({
      opnameId: stokOpname.opnameId,
      kode: stokOpname.kode,
      tanggal: stokOpname.tanggal,
      catatan: stokOpname.catatan,
      status: stokOpname.status,
      createdBy: users.namaUser,
    })
    .from(stokOpname)
    .innerJoin(users, eq(users.userId, stokOpname.userId))
    .where(filterDokumen(stokOpname.tanggal, stokOpname.status, query))
    .orderBy(desc(stokOpname.opnameId));

  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(stokOpnameItem)
    .where(inArray(stokOpnameItem.opnameId, rows.map((r) => r.opnameId)));

  return rows.map((r) => ({
    ...r,
    produk: items
      .filter((i) => i.opnameId === r.opnameId)
      .map((i) => ({
        bahanId: i.bahanId,
        nama: i.nama,
        stokSistem: Number(i.stokSistem),
        stokFisik: Number(i.stokFisik),
        selisih: Number(i.selisih),
      })),
  }));
}

/** Menyelaraskan stok bahan ke hasil hitung fisik pada dokumen. */
async function terapkanOpname(tx: Tx, opnameId: number) {
  const items = await tx
    .select()
    .from(stokOpnameItem)
    .where(eq(stokOpnameItem.opnameId, opnameId));

  for (const item of items) {
    await tx
      .update(bahanBaku)
      .set({ stok: item.stokFisik })
      .where(eq(bahanBaku.bahanId, item.bahanId));
  }
}

/**
 * Membuat dokumen opname. Stok sistem direkam saat dokumen dibuat supaya
 * selisihnya mencerminkan kondisi pada saat penghitungan, bukan saat diposting.
 */
export async function createOpname(userId: number, input: CreateOpnameInput) {
  const kode = await nextKode('SO', stokOpname);

  return db.transaction(async (tx) => {
    const bahanIds = input.items.map((i) => i.bahanId);
    const bahanRows = await tx
      .select({ id: bahanBaku.bahanId, nama: bahanBaku.namaBahan, stok: bahanBaku.stok })
      .from(bahanBaku)
      .where(inArray(bahanBaku.bahanId, bahanIds));
    const bahanMap = new Map(bahanRows.map((b) => [b.id, b]));

    const [dokumen] = await tx
      .insert(stokOpname)
      .values({
        kode,
        catatan: input.catatan ?? null,
        status: input.langsungPosting ? 'posted' : 'draft',
        userId,
      })
      .returning();

    for (const item of input.items) {
      const bahan = bahanMap.get(item.bahanId);
      if (!bahan) throw new NotFoundError(`Bahan baku id ${item.bahanId} tidak ditemukan`);
      const stokSistem = Number(bahan.stok);

      await tx.insert(stokOpnameItem).values({
        opnameId: dokumen.opnameId,
        bahanId: item.bahanId,
        nama: bahan.nama,
        stokSistem: toQty(stokSistem),
        stokFisik: toQty(item.stokFisik),
        selisih: toQty(item.stokFisik - stokSistem),
      });
    }

    if (input.langsungPosting) await terapkanOpname(tx, dokumen.opnameId);

    return dokumen;
  });
}

export async function postingOpname(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(stokOpname)
      .where(eq(stokOpname.opnameId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen opname tidak ditemukan');
    if (dokumen.status !== 'draft') {
      throw new ConflictError(`Dokumen berstatus "${dokumen.status}" tidak dapat diposting`);
    }

    await terapkanOpname(tx, id);

    const [updated] = await tx
      .update(stokOpname)
      .set({ status: 'posted' })
      .where(eq(stokOpname.opnameId, id))
      .returning();
    return updated;
  });
}

/**
 * Membatalkan dokumen opname. Stok sengaja tidak dikembalikan: opname
 * menyelaraskan angka sistem ke hitungan fisik, jadi mengembalikannya justru
 * membuat sistem berbeda lagi dari kenyataan di gudang.
 */
export async function batalOpname(id: number) {
  const [dokumen] = await db
    .select()
    .from(stokOpname)
    .where(eq(stokOpname.opnameId, id))
    .limit(1);
  if (!dokumen) throw new NotFoundError('Dokumen opname tidak ditemukan');
  if (dokumen.status === 'cancelled') throw new ConflictError('Dokumen sudah dibatalkan');

  const [updated] = await db
    .update(stokOpname)
    .set({ status: 'cancelled' })
    .where(eq(stokOpname.opnameId, id))
    .returning();
  return updated;
}

// -------------------------------------------------------- Produksi Stok

export async function listProduksi(query: RentangQuery) {
  const rows = await db
    .select({
      produksiId: produksiStok.produksiId,
      kode: produksiStok.kode,
      tanggal: produksiStok.tanggal,
      catatan: produksiStok.catatan,
      status: produksiStok.status,
      createdBy: users.namaUser,
    })
    .from(produksiStok)
    .innerJoin(users, eq(users.userId, produksiStok.userId))
    .where(filterDokumen(produksiStok.tanggal, produksiStok.status, query))
    .orderBy(desc(produksiStok.produksiId));

  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(produksiStokItem)
    .where(inArray(produksiStokItem.produksiId, rows.map((r) => r.produksiId)));

  return rows.map((r) => ({
    ...r,
    produk: items
      .filter((i) => i.produksiId === r.produksiId)
      .map((i) => ({ menuId: i.menuId, nama: i.nama, jumlah: i.jumlah })),
  }));
}

/** `arah` 1 menambah stok menu, -1 mengembalikannya saat dokumen dibatalkan. */
async function terapkanProduksi(tx: Tx, produksiId: number, arah: 1 | -1) {
  const items = await tx
    .select()
    .from(produksiStokItem)
    .where(eq(produksiStokItem.produksiId, produksiId));

  for (const item of items) {
    const delta = arah * item.jumlah;
    if (arah < 0) {
      const [menu] = await tx
        .select({ stok: menus.stok, nama: menus.namaMenu })
        .from(menus)
        .where(eq(menus.menuId, item.menuId))
        .limit(1);
      if (menu && menu.stok + delta < 0) {
        throw new ConflictError(
          `Stok "${menu.nama}" sudah terpakai, dokumen tidak dapat dibatalkan`,
        );
      }
    }
    await tx
      .update(menus)
      .set({ stok: sql`${menus.stok} + ${delta}` })
      .where(eq(menus.menuId, item.menuId));
  }
}

export async function createProduksi(userId: number, input: CreateProduksiInput) {
  const kode = await nextKode('PS', produksiStok);

  return db.transaction(async (tx) => {
    const menuIds = input.items.map((i) => i.menuId);
    const menuRows = await tx
      .select({ id: menus.menuId, nama: menus.namaMenu })
      .from(menus)
      .where(inArray(menus.menuId, menuIds));
    const menuMap = new Map(menuRows.map((m) => [m.id, m.nama]));

    const [dokumen] = await tx
      .insert(produksiStok)
      .values({
        kode,
        catatan: input.catatan ?? null,
        status: input.langsungPosting ? 'posted' : 'draft',
        userId,
      })
      .returning();

    for (const item of input.items) {
      const nama = menuMap.get(item.menuId);
      if (!nama) throw new NotFoundError(`Menu id ${item.menuId} tidak ditemukan`);
      await tx.insert(produksiStokItem).values({
        produksiId: dokumen.produksiId,
        menuId: item.menuId,
        nama,
        jumlah: item.jumlah,
      });
    }

    if (input.langsungPosting) await terapkanProduksi(tx, dokumen.produksiId, 1);

    return dokumen;
  });
}

export async function postingProduksi(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(produksiStok)
      .where(eq(produksiStok.produksiId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen produksi tidak ditemukan');
    if (dokumen.status !== 'draft') {
      throw new ConflictError(`Dokumen berstatus "${dokumen.status}" tidak dapat diposting`);
    }

    await terapkanProduksi(tx, id, 1);

    const [updated] = await tx
      .update(produksiStok)
      .set({ status: 'posted' })
      .where(eq(produksiStok.produksiId, id))
      .returning();
    return updated;
  });
}

export async function batalProduksi(id: number) {
  return db.transaction(async (tx) => {
    const [dokumen] = await tx
      .select()
      .from(produksiStok)
      .where(eq(produksiStok.produksiId, id))
      .limit(1);
    if (!dokumen) throw new NotFoundError('Dokumen produksi tidak ditemukan');
    if (dokumen.status === 'cancelled') throw new ConflictError('Dokumen sudah dibatalkan');

    if (dokumen.status === 'posted') await terapkanProduksi(tx, id, -1);

    const [updated] = await tx
      .update(produksiStok)
      .set({ status: 'cancelled' })
      .where(eq(produksiStok.produksiId, id))
      .returning();
    return updated;
  });
}
