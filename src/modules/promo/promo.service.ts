import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/config/database';
import { promo } from '@/db/schema/promo';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';
import type { CreatePromoInput, UpdatePromoInput, ValidatePromoInput } from './promo.schema';

type PromoRow = typeof promo.$inferSelect;

/** Tanggal hari ini dalam format kolom `date` (YYYY-MM-DD). */
function hariIni(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Potongan rupiah dari sebuah promo terhadap subtotal.
 * Dihitung server-side agar besaran diskon tidak bisa diatur dari klien.
 */
export function hitungDiskon(row: PromoRow, subtotal: number): number {
  const nilai = Number(row.nilai);
  let diskon = row.tipe === 'percent' ? Math.round((subtotal * nilai) / 100) : Math.round(nilai);
  if (row.tipe === 'percent' && row.maxDiskon !== null) {
    diskon = Math.min(diskon, row.maxDiskon);
  }
  // Potongan tidak boleh negatif maupun melebihi subtotal.
  return Math.max(0, Math.min(diskon, subtotal));
}

function toPublic(row: PromoRow) {
  return {
    promoId: row.promoId,
    kode: row.kode,
    nama: row.nama,
    tipe: row.tipe,
    nilai: Number(row.nilai),
    minBelanja: row.minBelanja,
    maxDiskon: row.maxDiskon,
    isActive: row.isActive,
    mulai: row.mulai,
    berakhir: row.berakhir,
  };
}

/** Cari promo berdasarkan kode (case-insensitive). */
async function findByKode(kode: string) {
  const [row] = await db
    .select()
    .from(promo)
    .where(sql`upper(${promo.kode}) = upper(${kode})`)
    .limit(1);
  return row;
}

/**
 * Daftar promo. Default hanya promo yang sedang berlaku (untuk POS);
 * `includeInactive` menampilkan seluruhnya untuk layar owner.
 */
export async function listPromo(includeInactive = false) {
  const rows = await db.select().from(promo).orderBy(desc(promo.promoId));
  if (includeInactive) return rows.map(toPublic);

  const today = hariIni();
  return rows
    .filter(
      (r) => r.isActive && (!r.mulai || r.mulai <= today) && (!r.berakhir || r.berakhir >= today),
    )
    .map(toPublic);
}

/**
 * Validasi kode promo terhadap subtotal keranjang dan kembalikan nominal
 * potongan. Ini satu-satunya sumber kebenaran besaran diskon promo.
 */
export async function validatePromo(input: ValidatePromoInput) {
  const row = await findByKode(input.kode);
  if (!row) throw new NotFoundError('Kode promo tidak ditemukan');
  if (!row.isActive) throw new BadRequestError('Promo sudah tidak aktif');

  const today = hariIni();
  if (row.mulai && row.mulai > today) throw new BadRequestError('Promo belum berlaku');
  if (row.berakhir && row.berakhir < today) throw new BadRequestError('Promo sudah kedaluwarsa');
  if (input.subtotal < row.minBelanja) {
    throw new BadRequestError(
      `Minimal belanja Rp${row.minBelanja.toLocaleString('id-ID')} untuk memakai promo ini`,
    );
  }

  return { promo: toPublic(row), diskon: hitungDiskon(row, input.subtotal) };
}

export async function createPromo(input: CreatePromoInput) {
  if (await findByKode(input.kode)) {
    throw new ConflictError('Kode promo sudah terpakai');
  }
  const [created] = await db
    .insert(promo)
    .values({ ...input, nilai: String(input.nilai) })
    .returning();
  return created ? toPublic(created) : null;
}

export async function updatePromo(id: number, input: UpdatePromoInput) {
  const [existing] = await db.select().from(promo).where(eq(promo.promoId, id)).limit(1);
  if (!existing) throw new NotFoundError('Promo tidak ditemukan');

  if (input.kode) {
    const conflict = await findByKode(input.kode);
    if (conflict && conflict.promoId !== id) {
      throw new ConflictError('Kode promo sudah terpakai');
    }
  }

  const updates: Partial<typeof promo.$inferInsert> = { ...input, nilai: undefined };
  if (input.nilai !== undefined) updates.nilai = String(input.nilai);

  const [updated] = await db
    .update(promo)
    .set(updates)
    .where(eq(promo.promoId, id))
    .returning();
  return updated ? toPublic(updated) : null;
}

export async function deletePromo(id: number) {
  const [existing] = await db.select().from(promo).where(eq(promo.promoId, id)).limit(1);
  if (!existing) throw new NotFoundError('Promo tidak ditemukan');
  await db.delete(promo).where(eq(promo.promoId, id));
}
