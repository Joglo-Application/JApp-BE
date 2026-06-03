import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createPembayaranSchema,
  listPembayaranQuerySchema,
  pembayaranIdParamSchema,
} from './pembayaran.schema';
import {
  createPembayaranHandler,
  getPembayaranHandler,
  listPembayaranHandler,
} from './pembayaran.handler';
import type { AppBindings } from '@/types/hono';

export const pembayaranRoutes = new Hono<AppBindings>();

pembayaranRoutes.use('*', authMiddleware);

// Read: semua role
pembayaranRoutes.get(
  '/',
  validate('query', listPembayaranQuerySchema),
  listPembayaranHandler,
);
pembayaranRoutes.get(
  '/:id',
  validate('param', pembayaranIdParamSchema),
  getPembayaranHandler,
);

// Write: admin & kasir
pembayaranRoutes.post(
  '/',
  requireRole('admin', 'kasir'),
  validate('json', createPembayaranSchema),
  createPembayaranHandler,
);
