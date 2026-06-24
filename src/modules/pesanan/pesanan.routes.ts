import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createPesananSchema,
  listPesananQuerySchema,
  pesananIdParamSchema,
} from './pesanan.schema';
import {
  cancelPesananHandler,
  createPesananHandler,
  deletePesananHandler,
  getPesananHandler,
  listPesananHandler,
} from './pesanan.handler';
import type { AppBindings } from '@/types/hono';

export const pesananRoutes = new Hono<AppBindings>();

pesananRoutes.use('*', authMiddleware);

// Read: semua role
pesananRoutes.get('/', validate('query', listPesananQuerySchema), listPesananHandler);
pesananRoutes.get('/:id', validate('param', pesananIdParamSchema), getPesananHandler);

// Write: admin & kasir
pesananRoutes.post(
  '/',
  requireRole('admin', 'kasir'),
  validate('json', createPesananSchema),
  createPesananHandler,
);
pesananRoutes.post(
  '/:id/cancel',
  requireRole('admin', 'kasir'),
  validate('param', pesananIdParamSchema),
  cancelPesananHandler,
);
// Hapus draft held (saat di-Pilih/Gabung kembali ke POS).
pesananRoutes.delete(
  '/:id',
  requireRole('admin', 'kasir'),
  validate('param', pesananIdParamSchema),
  deletePesananHandler,
);
