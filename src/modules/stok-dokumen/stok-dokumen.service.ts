import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/config/database';
import { produksiStok, stokOpname } from '@/db/schema/stok-dokumen';
import { bahanBaku } from '@/db/schema/bahan-baku';
import { menus } from '@/db/schema/menus';
import { users } from '@/db/schema/users';
import { NotFoundError } from '@/shared/errors';
import type { CreateOpnameInput, CreateProduksiInput, RentangQuery } from './stok-dokumen.schema';

/** Pembulatan numeric ke skala 3 desimal sesuai kolom DB stok. */
function toQty(value: number): string {
  return value.toFixed(3);
}

/** Nomor dokumen berurutan, mis. SO-001 / PS-001 (sesuai format di FE). */
async function nextKode(prefix: string, table: typeof stokOpname | typeof produksiStok) {
  const [row] = await db.select({ jumlah: count() }).from(table);
  return `${prefix}-${String(Number(row?.jumlah ?? 0) + 1).padStart(3, '0')}`;
}

function filterRentang(kolom: AnyPgColumn, query: RentangQuery) {
  const kondisi = [];
  if (query.start) kondisi.push(gte(kolom, query.start));
  if (query.end) kondisi.push(lte(kolom, query.end));
  return kondisi.length ? and(...kondisi) : undefined;
}

export async function listOpname(query: RentangQuery) {
  return db
    .select({
      opnameId: stokOpname.opnameId,
      kode: stokOpname.kode,
      tanggal: stokOpname.tanggal,
      bahanId: stokOpname.bahanId,
      namaBahan: bahanBaku.namaBahan,
      stokSistem: stokOpname.stokSistem,
      stokFisik: stokOpname.stokFisik,
      selisih: stokOpname.selisih,
      catatan: stokOpname.catatan,
      namaUser: users.namaUser,
    })
    .from(stokOpname)
    .innerJoin(bahanBaku, eq(bahanBaku.bahanId, stokOpname.bahanId))
    .innerJoin(users, eq(users.userId, stokOpname.userId))
    .where(filterRentang(stokOpname.tanggal, query))
    .orderBy(desc(stokOpname.opnameId));
}

/**
 * Mencatat stok opname sekaligus menyelaraskan stok sistem ke hasil hitung
 * fisik. Selisihnya disimpan agar bisa ditelusuri.
 */
export async function createOpname(userId: number, input: CreateOpnameInput) {
  const kode = await nextKode('SO', stokOpname);

  return db.transaction(async (tx) => {
    const [bahan] = await tx
      .select()
      .from(bahanBaku)
      .where(eq(bahanBaku.bahanId, input.bahanId))
      .limit(1);
    if (!bahan) throw new NotFoundError('Bahan baku tidak ditemukan');

    const stokSistem = Number(bahan.stok);
    const selisih = input.stokFisik - stokSistem;

    const [created] = await tx
      .insert(stokOpname)
      .values({
        kode,
        bahanId: input.bahanId,
        stokSistem: toQty(stokSistem),
        stokFisik: toQty(input.stokFisik),
        selisih: toQty(selisih),
        catatan: input.catatan ?? null,
        userId,
      })
      .returning();

    await tx
      .update(bahanBaku)
      .set({ stok: toQty(input.stokFisik) })
      .where(eq(bahanBaku.bahanId, input.bahanId));

    return created;
  });
}

export async function listProduksi(query: RentangQuery) {
  return db
    .select({
      produksiId: produksiStok.produksiId,
      kode: produksiStok.kode,
      tanggal: produksiStok.tanggal,
      menuId: produksiStok.menuId,
      namaMenu: menus.namaMenu,
      jumlah: produksiStok.jumlah,
      catatan: produksiStok.catatan,
      namaUser: users.namaUser,
    })
    .from(produksiStok)
    .innerJoin(menus, eq(menus.menuId, produksiStok.menuId))
    .innerJoin(users, eq(users.userId, produksiStok.userId))
    .where(filterRentang(produksiStok.tanggal, query))
    .orderBy(desc(produksiStok.produksiId));
}

/**
 * Mencatat produksi stok menu (barang jadi) dan menambah `menus.stok`.
 * Pasangan dari pemotongan stok menu tanpa resep saat penjualan.
 */
export async function createProduksi(userId: number, input: CreateProduksiInput) {
  const kode = await nextKode('PS', produksiStok);

  return db.transaction(async (tx) => {
    const [menu] = await tx.select().from(menus).where(eq(menus.menuId, input.menuId)).limit(1);
    if (!menu) throw new NotFoundError('Menu tidak ditemukan');

    const [created] = await tx
      .insert(produksiStok)
      .values({
        kode,
        menuId: input.menuId,
        jumlah: input.jumlah,
        catatan: input.catatan ?? null,
        userId,
      })
      .returning();

    await tx
      .update(menus)
      .set({ stok: sql`${menus.stok} + ${input.jumlah}` })
      .where(eq(menus.menuId, input.menuId));

    return created;
  });
}
