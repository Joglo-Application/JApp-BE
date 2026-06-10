import { and, count, asc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { meja } from '@/db/schema/meja';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type { CreateMejaInput, ListMejaQuery, UpdateMejaInput } from './meja.schema';

export async function listMeja(query: ListMejaQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = and(
    query.zona ? eq(meja.zona, query.zona) : undefined,
    query.status ? eq(meja.status, query.status) : undefined,
  );

  const [data, totalRows] = await Promise.all([
    db.select().from(meja).where(whereClause).orderBy(asc(meja.mejaId)).limit(limit).offset(offset),
    db.select({ count: count() }).from(meja).where(whereClause),
  ]);

  return { data, pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) } };
}

export async function getMejaById(id: number) {
  const [row] = await db.select().from(meja).where(eq(meja.mejaId, id)).limit(1);
  if (!row) throw new NotFoundError('Meja tidak ditemukan');
  return row;
}

export async function createMeja(input: CreateMejaInput) {
  const [existing] = await db
    .select({ id: meja.mejaId })
    .from(meja)
    .where(eq(meja.nomor, input.nomor))
    .limit(1);
  if (existing) throw new ConflictError(`Meja "${input.nomor}" sudah ada`);

  const [created] = await db
    .insert(meja)
    .values({
      nomor: input.nomor,
      zona: input.zona ?? null,
      kapasitas: input.kapasitas,
      status: input.status,
    })
    .returning();
  return created;
}

export async function updateMeja(id: number, input: UpdateMejaInput) {
  await getMejaById(id);
  const [updated] = await db.update(meja).set(input).where(eq(meja.mejaId, id)).returning();
  return updated;
}

export async function updateMejaStatus(id: number, status: 'available' | 'occupied' | 'reserved') {
  await getMejaById(id);
  const [updated] = await db.update(meja).set({ status }).where(eq(meja.mejaId, id)).returning();
  return updated;
}

export async function deleteMeja(id: number) {
  await getMejaById(id);
  await db.delete(meja).where(eq(meja.mejaId, id));
}
