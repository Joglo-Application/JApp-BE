import { eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { users } from '@/db/schema/users';
import { UnauthorizedError, NotFoundError } from '@/shared/errors';
import { verifyPassword } from '@/utils/password';
import { signToken } from '@/utils/jwt';
import type { LoginInput } from './auth.schema';
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
