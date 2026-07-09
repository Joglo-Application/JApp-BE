import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { createLogGudangSchema, listLogGudangQuerySchema } from './log-gudang.schema';
import { createLogGudangHandler, listLogGudangHandler } from './log-gudang.handler';
import type { AppBindings } from '@/types/hono';

export const logGudangRoutes = new Hono<AppBindings>();

logGudangRoutes.use('*', authMiddleware);

// POST /log-gudang — catat aksi gudang (dilakukan oleh gudang/admin).
logGudangRoutes.post(
  '/',
  requireRole('admin', 'gudang'),
  validate('json', createLogGudangSchema),
  createLogGudangHandler,
);

// GET /log-gudang?date=&jenis= — untuk halaman Owner → Log Gudang.
logGudangRoutes.get(
  '/',
  requireRole('admin', 'owner', 'gudang', 'supervisor'),
  validate('query', listLogGudangQuerySchema),
  listLogGudangHandler,
);
