import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createMejaSchema,
  createReservasiSchema,
  listMejaQuerySchema,
  mejaIdParamSchema,
  updateMejaSchema,
  updateMejaStatusSchema,
} from './meja.schema';
import {
  cancelReservasiHandler,
  createMejaHandler,
  createReservasiHandler,
  deleteMejaHandler,
  getMejaHandler,
  listMejaHandler,
  listPesananMejaHandler,
  updateMejaHandler,
  updateMejaStatusHandler,
} from './meja.handler';
import type { AppBindings } from '@/types/hono';

export const mejaRoutes = new Hono<AppBindings>();

mejaRoutes.use('*', authMiddleware);

// Read: semua role
mejaRoutes.get('/', validate('query', listMejaQuerySchema), listMejaHandler);
mejaRoutes.get('/:id', validate('param', mejaIdParamSchema), getMejaHandler);

// GET /meja/:id/pesanan — pesanan aktif + total tamu + reservasi pada meja.
mejaRoutes.get('/:id/pesanan', validate('param', mejaIdParamSchema), listPesananMejaHandler);

// Reservasi meja: operasional (kasir/SPV/owner/admin).
mejaRoutes.post(
  '/:id/reservasi',
  requireRole('admin', 'kasir', 'supervisor', 'owner'),
  validate('param', mejaIdParamSchema),
  validate('json', createReservasiSchema),
  createReservasiHandler,
);
mejaRoutes.delete(
  '/:id/reservasi',
  requireRole('admin', 'kasir', 'supervisor', 'owner'),
  validate('param', mejaIdParamSchema),
  cancelReservasiHandler,
);

// Update status: admin & kasir (operasional saat melayani meja)
mejaRoutes.patch(
  '/:id/status',
  requireRole('admin', 'kasir'),
  validate('param', mejaIdParamSchema),
  validate('json', updateMejaStatusSchema),
  updateMejaStatusHandler,
);

// Kelola master meja: admin
mejaRoutes.post('/', requireRole('admin'), validate('json', createMejaSchema), createMejaHandler);
mejaRoutes.patch(
  '/:id',
  requireRole('admin'),
  validate('param', mejaIdParamSchema),
  validate('json', updateMejaSchema),
  updateMejaHandler,
);
mejaRoutes.delete('/:id', requireRole('admin'), validate('param', mejaIdParamSchema), deleteMejaHandler);
