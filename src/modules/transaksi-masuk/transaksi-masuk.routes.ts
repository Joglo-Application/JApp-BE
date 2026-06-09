import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createTransaksiMasukSchema,
  listTransaksiMasukQuerySchema,
  transaksiMasukIdParamSchema,
} from './transaksi-masuk.schema';
import {
  createTransaksiMasukHandler,
  getTransaksiMasukHandler,
  listTransaksiMasukHandler,
} from './transaksi-masuk.handler';
import type { AppBindings } from '@/types/hono';

export const transaksiMasukRoutes = new Hono<AppBindings>();

transaksiMasukRoutes.use('*', authMiddleware);

// Read: semua role
transaksiMasukRoutes.get(
  '/',
  validate('query', listTransaksiMasukQuerySchema),
  listTransaksiMasukHandler,
);
transaksiMasukRoutes.get(
  '/:id',
  validate('param', transaksiMasukIdParamSchema),
  getTransaksiMasukHandler,
);

// Write: admin
transaksiMasukRoutes.post(
  '/',
  requireRole('admin'),
  validate('json', createTransaksiMasukSchema),
  createTransaksiMasukHandler,
);
