import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createTransaksiKeluarSchema,
  listTransaksiKeluarQuerySchema,
  transaksiKeluarIdParamSchema,
} from './transaksi-keluar.schema';
import {
  createTransaksiKeluarHandler,
  getTransaksiKeluarHandler,
  listTransaksiKeluarHandler,
} from './transaksi-keluar.handler';
import type { AppBindings } from '@/types/hono';

export const transaksiKeluarRoutes = new Hono<AppBindings>();

transaksiKeluarRoutes.use('*', authMiddleware);

// Read: semua role
transaksiKeluarRoutes.get(
  '/',
  validate('query', listTransaksiKeluarQuerySchema),
  listTransaksiKeluarHandler,
);
transaksiKeluarRoutes.get(
  '/:id',
  validate('param', transaksiKeluarIdParamSchema),
  getTransaksiKeluarHandler,
);

// Write: admin
transaksiKeluarRoutes.post(
  '/',
  requireRole('admin'),
  validate('json', createTransaksiKeluarSchema),
  createTransaksiKeluarHandler,
);
