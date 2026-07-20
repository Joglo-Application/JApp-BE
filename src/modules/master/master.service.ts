import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { area } from '@/db/schema/area';
import { kategori } from '@/db/schema/kategori';
import { metodePembayaran } from '@/db/schema/metode-pembayaran';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type {
  CreateAreaInput,
  CreateKategoriInput,
  CreateMetodeInput,
  UpdateAreaInput,
  UpdateKategoriInput,
  UpdateMetodeInput,
} from './master.schema';

// ---------------------------------------------------------------- Area

export async function listArea() {
  return db.select().from(area).orderBy(asc(area.urutan), asc(area.areaId));
}

export async function createArea(input: CreateAreaInput) {
  const [created] = await db.insert(area).values(input).returning();
  return created;
}

export async function updateArea(id: number, input: UpdateAreaInput) {
  const [existing] = await db.select().from(area).where(eq(area.areaId, id)).limit(1);
  if (!existing) throw new NotFoundError('Area tidak ditemukan');
  const [updated] = await db.update(area).set(input).where(eq(area.areaId, id)).returning();
  return updated;
}

export async function deleteArea(id: number) {
  const [existing] = await db.select().from(area).where(eq(area.areaId, id)).limit(1);
  if (!existing) throw new NotFoundError('Area tidak ditemukan');
  // Meja yang menunjuk area ini otomatis di-set null (ON DELETE SET NULL).
  await db.delete(area).where(eq(area.areaId, id));
}

// ------------------------------------------------------------ Kategori

export async function listKategori(jenis?: 'menu' | 'stok' | 'stok_gudang') {
  return db
    .select()
    .from(kategori)
    .where(jenis ? eq(kategori.jenis, jenis) : undefined)
    .orderBy(asc(kategori.urutan), asc(kategori.kategoriId));
}

export async function createKategori(input: CreateKategoriInput) {
  const [duplikat] = await db
    .select({ id: kategori.kategoriId })
    .from(kategori)
    .where(and(eq(kategori.jenis, input.jenis), eq(kategori.nama, input.nama)))
    .limit(1);
  if (duplikat) throw new ConflictError('Kategori dengan nama tersebut sudah ada');

  const [created] = await db.insert(kategori).values(input).returning();
  return created;
}

export async function updateKategori(id: number, input: UpdateKategoriInput) {
  const [existing] = await db
    .select()
    .from(kategori)
    .where(eq(kategori.kategoriId, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Kategori tidak ditemukan');

  if (input.nama) {
    const [duplikat] = await db
      .select({ id: kategori.kategoriId })
      .from(kategori)
      .where(and(eq(kategori.jenis, existing.jenis), eq(kategori.nama, input.nama)))
      .limit(1);
    if (duplikat && duplikat.id !== id) {
      throw new ConflictError('Kategori dengan nama tersebut sudah ada');
    }
  }

  const [updated] = await db
    .update(kategori)
    .set(input)
    .where(eq(kategori.kategoriId, id))
    .returning();
  return updated;
}

export async function deleteKategori(id: number) {
  const [existing] = await db
    .select()
    .from(kategori)
    .where(eq(kategori.kategoriId, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Kategori tidak ditemukan');
  await db.delete(kategori).where(eq(kategori.kategoriId, id));
}

// --------------------------------------------------- Metode pembayaran

export async function listMetode() {
  return db
    .select()
    .from(metodePembayaran)
    .orderBy(asc(metodePembayaran.urutan), asc(metodePembayaran.metodeId));
}

export async function createMetode(input: CreateMetodeInput) {
  const [created] = await db.insert(metodePembayaran).values(input).returning();
  return created;
}

export async function updateMetode(id: number, input: UpdateMetodeInput) {
  const [existing] = await db
    .select()
    .from(metodePembayaran)
    .where(eq(metodePembayaran.metodeId, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Metode pembayaran tidak ditemukan');
  const [updated] = await db
    .update(metodePembayaran)
    .set(input)
    .where(eq(metodePembayaran.metodeId, id))
    .returning();
  return updated;
}

export async function deleteMetode(id: number) {
  const [existing] = await db
    .select()
    .from(metodePembayaran)
    .where(eq(metodePembayaran.metodeId, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Metode pembayaran tidak ditemukan');
  await db.delete(metodePembayaran).where(eq(metodePembayaran.metodeId, id));
}
