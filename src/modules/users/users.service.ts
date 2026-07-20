import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/config/database';
import { users } from '@/db/schema/users';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { hashPassword } from '@/utils/password';
import { getPaginationParams, type PaginationQuery } from '@/shared/pagination';
import { toCsv, waktuLokal } from '@/shared/csv';
import type { CreateUserInput, UpdateUserInput } from './users.schema';

const userPublicColumns = {
  userId: users.userId,
  namaUser: users.namaUser,
  username: users.username,
  email: users.email,
  telepon: users.telepon,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function listUsers(query: PaginationQuery) {
  const { limit, offset, page } = getPaginationParams(query);

  const whereClause = query.q
    ? or(ilike(users.namaUser, `%${query.q}%`), ilike(users.username, `%${query.q}%`))
    : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select(userPublicColumns)
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.userId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(users).where(whereClause),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(totalRows[0]?.count ?? 0),
    },
  };
}

/** Daftar pegawai sebagai CSV untuk tombol Export di halaman Pegawai. */
export async function exportUsers() {
  const rows = await db
    .select(userPublicColumns)
    .from(users)
    .orderBy(desc(users.userId));

  return {
    filename: `pegawai-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: toCsv(
      ['Nama', 'Username', 'Email', 'Telepon', 'Role', 'Dibuat'],
      rows.map((r) => [
        r.namaUser,
        r.username,
        r.email,
        r.telepon,
        r.role,
        waktuLokal(r.createdAt),
      ]),
    ),
  };
}

export async function getUserById(id: number) {
  const [user] = await db
    .select(userPublicColumns)
    .from(users)
    .where(eq(users.userId, id))
    .limit(1);
  if (!user) throw new NotFoundError('User tidak ditemukan');
  return user;
}

export async function createUser(input: CreateUserInput, actorRole?: string) {
  // Owner boleh kelola pegawai, tapi tidak boleh membuat akun admin.
  if (actorRole === 'owner' && input.role === 'admin') {
    throw new ForbiddenError('Owner tidak dapat membuat akun admin');
  }

  const [existing] = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);
  if (existing) throw new ConflictError('Username sudah terpakai');

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(users)
    .values({
      ...input,
      password: passwordHash,
      // PIN persetujuan disimpan sebagai hash, tidak pernah dikembalikan.
      pin: input.pin ? await hashPassword(input.pin) : undefined,
    })
    .returning(userPublicColumns);

  return created;
}

export async function updateUser(id: number, input: UpdateUserInput, actorRole?: string) {
  const target = await getUserById(id);
  // Owner tidak boleh menyentuh akun admin atau menaikkan role jadi admin.
  if (actorRole === 'owner' && (target.role === 'admin' || input.role === 'admin')) {
    throw new ForbiddenError('Owner tidak dapat mengubah akun/role admin');
  }

  if (input.username) {
    const [conflict] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(and(eq(users.username, input.username)))
      .limit(1);
    if (conflict && conflict.userId !== id) {
      throw new ConflictError('Username sudah terpakai');
    }
  }

  const updates: Partial<typeof users.$inferInsert> = { ...input };
  if (input.password) {
    updates.password = await hashPassword(input.password);
  }
  if (input.pin) {
    updates.pin = await hashPassword(input.pin);
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.userId, id))
    .returning(userPublicColumns);

  return updated;
}

export async function deleteUser(id: number, actorRole?: string) {
  const target = await getUserById(id);
  if (actorRole === 'owner' && target.role === 'admin') {
    throw new ForbiddenError('Owner tidak dapat menghapus akun admin');
  }
  await db.delete(users).where(eq(users.userId, id));
}
