import { createMiddleware } from 'hono/factory';
import { randomUUID } from 'node:crypto';
import type { AppBindings } from '@/types/hono';

export const requestIdMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const existing = c.req.header('x-request-id');
  const requestId = existing ?? randomUUID();
  c.set('requestId', requestId);
  c.header('x-request-id', requestId);
  await next();
});
