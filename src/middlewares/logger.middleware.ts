import { createMiddleware } from 'hono/factory';
import { logger } from '@/utils/logger';
import type { AppBindings } from '@/types/hono';

export const loggerMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;
  const requestId = c.get('requestId');

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info(
    {
      requestId,
      method,
      url,
      status,
      duration: `${duration}ms`,
    },
    `${method} ${url} ${status} - ${duration}ms`,
  );
});
