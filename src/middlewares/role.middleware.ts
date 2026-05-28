import { createMiddleware } from 'hono/factory';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors';
import type { AppBindings, AuthUser } from '@/types/hono';

type Role = AuthUser['role'];

export function requireRole(...allowed: Role[]) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowed.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${allowed.join(' or ')}`,
      );
    }
    await next();
  });
}
