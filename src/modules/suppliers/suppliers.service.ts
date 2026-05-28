import { count, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/config/database';
import { suppliers } from '@/db/schema/suppliers';
import { NotFoundError } from '@/shared/errors';
import { getPaginationParams, type PaginationQuery } from '@/shared/pagination';
import type { CreateSupplierInput, UpdateSupplierInput } from './suppliers.schema';

export async function listSuppliers(query: PaginationQuery) {
  const { limit, offset, page } = getPaginationParams(query);
  const whereClause = query.q ? ilike(suppliers.namaSupplier, `%${query.q}%`) : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(suppliers)
      .where(whereClause)
      .orderBy(desc(suppliers.supplierId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(suppliers).where(whereClause),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) },
  };
}

export async function getSupplierById(id: number) {
  const [row] = await db.select().from(suppliers).where(eq(suppliers.supplierId, id)).limit(1);
  if (!row) throw new NotFoundError('Supplier tidak ditemukan');
  return row;
}

export async function createSupplier(input: CreateSupplierInput) {
  const [created] = await db.insert(suppliers).values(input).returning();
  return created;
}

export async function updateSupplier(id: number, input: UpdateSupplierInput) {
  await getSupplierById(id);
  const [updated] = await db
    .update(suppliers)
    .set(input)
    .where(eq(suppliers.supplierId, id))
    .returning();
  return updated;
}

export async function deleteSupplier(id: number) {
  await getSupplierById(id);
  await db.delete(suppliers).where(eq(suppliers.supplierId, id));
}
