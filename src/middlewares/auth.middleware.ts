import { createMiddleware } from 'hono/factory';
import { UnauthorizedError } from '@/shared/errors';
import { verifyToken } from '@/utils/jwt';
import type { AppBindings, AuthUser } from '@/types/hono';

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const header = c.req.header('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Token is empty');
  }

  const payload = await verifyToken(token);

  const user: AuthUser = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  };

  c.set('user', user);
  await next();
});
