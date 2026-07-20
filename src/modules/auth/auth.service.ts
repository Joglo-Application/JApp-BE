import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '@/config/database';
import { users } from '@/db/schema/users';
import { UnauthorizedError, NotFoundError } from '@/shared/errors';
import { verifyPassword } from '@/utils/password';
import { signToken } from '@/utils/jwt';
import type { LoginInput, VerifyPinInput } from './auth.schema';
import type { UserRole } from '@/types/hono';

export interface LoginResult {
  token: string;
  user: {
    userId: number;
    namaUser: string;
    username: string;
    role: UserRole;
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError('Username atau password salah');
  }

  const isValid = await verifyPassword(input.password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('Username atau password salah');
  }

  const token = await signToken({
    userId: user.userId,
    username: user.username,
    role: user.role,
  });

  return {
    token,
    user: {
      userId: user.userId,
      namaUser: user.namaUser,
      username: user.username,
      role: user.role,
    },
  };
}

/** Role yang boleh menyetujui aksi terbatas lewat PIN. */
const APPROVER_ROLES = ['admin', 'owner', 'supervisor'] as const;

/**
 * Verifikasi PIN persetujuan supervisor. Dipakai kasir untuk aksi yang butuh
 * approval (buka blokir meja, batalkan pesanan). FE hanya mengirim PIN tanpa
 * username, jadi PIN dicocokkan ke seluruh user berperan approver.
 * Mengembalikan identitas penyetuju agar bisa dicatat di log transaksi.
 */
export async function verifyPin(input: VerifyPinInput) {
  const approvers = await db
    .select({
      userId: users.userId,
      namaUser: users.namaUser,
      role: users.role,
      pin: users.pin,
    })
    .from(users)
    .where(and(inArray(users.role, [...APPROVER_ROLES]), isNotNull(users.pin)));

  for (const approver of approvers) {
    if (approver.pin && (await verifyPassword(input.pin, approver.pin))) {
      return {
        userId: approver.userId,
        namaUser: approver.namaUser,
        role: approver.role,
      };
    }
  }

  throw new UnauthorizedError('PIN tidak valid');
}

export async function getCurrentUser(userId: number) {
  const [user] = await db
    .select({
      userId: users.userId,
      namaUser: users.namaUser,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  if (!user) {
    throw new NotFoundError('User tidak ditemukan');
  }

  return user;
}
