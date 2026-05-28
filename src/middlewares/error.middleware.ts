import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { AppError } from '@/shared/errors';
import { error as errorResponse } from '@/shared/response';
import { logger } from '@/utils/logger';
import { isProd } from '@/config/env';
import type { AppBindings, AppVariables } from '@/types/hono';

type ContentfulStatusCode = Parameters<
  Parameters<ErrorHandler<AppBindings>>[1]['json']
>[1] extends number | undefined
  ? number
  : never;

export const errorHandler: ErrorHandler<AppBindings> = (err, c) => {
  const requestId = (c.get as (key: keyof AppVariables) => string | undefined)('requestId');

  if (err instanceof AppError) {
    logger.warn(
      { requestId, code: err.code, message: err.message, details: err.details },
      'AppError caught',
    );
    return c.json(
      errorResponse(err.code, err.message, err.details),
      err.statusCode as ContentfulStatusCode,
    );
  }

  if (err instanceof ZodError) {
    logger.warn({ requestId, issues: err.issues }, 'Validation error');
    return c.json(
      errorResponse('VALIDATION_ERROR', 'Validation failed', err.flatten()),
      422,
    );
  }

  if (err instanceof HTTPException) {
    logger.warn({ requestId, status: err.status, message: err.message }, 'HTTPException');
    return c.json(errorResponse('HTTP_ERROR', err.message), err.status);
  }

  logger.error({ requestId, err }, 'Unhandled error');
  return c.json(
    errorResponse(
      'INTERNAL_ERROR',
      isProd ? 'Internal server error' : err.message,
      isProd ? undefined : { stack: err.stack },
    ),
    500,
  );
};

export const notFoundHandler: NotFoundHandler<AppBindings> = (c) => {
  return c.json(
    errorResponse('NOT_FOUND', `Route ${c.req.method} ${c.req.path} not found`),
    404,
  );
};
