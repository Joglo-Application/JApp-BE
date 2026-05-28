import { sign, verify } from 'hono/jwt';
import { env } from '@/config/env';
import { UnauthorizedError } from '@/shared/errors';
import type { AuthUser } from '@/types/hono';

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    throw new Error(`Invalid JWT_EXPIRES_IN format: ${value}`);
  }
  const [, amount, unit] = match;
  const n = Number(amount);
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    default:
      throw new Error(`Invalid JWT_EXPIRES_IN unit: ${unit}`);
  }
}

export async function signToken(payload: AuthUser): Promise<string> {
  const expiresInSeconds = parseExpiresIn(env.JWT_EXPIRES_IN);
  const nowSeconds = Math.floor(Date.now() / 1000);

  return sign(
    {
      ...payload,
      iat: nowSeconds,
      exp: nowSeconds + expiresInSeconds,
    },
    env.JWT_SECRET,
  );
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const payload = await verify(token, env.JWT_SECRET, 'HS256');
    return payload as unknown as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
