import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createPesananBahanSchema,
  listPesananBahanQuerySchema,
  pesananBahanIdParamSchema,
  receivePesananBahanSchema,
} from './pesanan-bahan.schema';
import {
  cancelPesananBahanHandler,
  createPesananBahanHandler,
  getPesananBahanHandler,
  listPesananBahanHandler,
  receivePesananBahanHandler,
} from './pesanan-bahan.handler';
import type { AppBindings } from '@/types/hono';

export const pesananBahanRoutes = new Hono<AppBindings>();

pesananBahanRoutes.use('*', authMiddleware);

// Read: semua role
pesananBahanRoutes.get(
  '/',
  validate('query', listPesananBahanQuerySchema),
  listPesananBahanHandler,
);
pesananBahanRoutes.get(
  '/:id',
  validate('param', pesananBahanIdParamSchema),
  getPesananBahanHandler,
);

// Write: admin
pesananBahanRoutes.post(
  '/',
  requireRole('admin'),
  validate('json', createPesananBahanSchema),
  createPesananBahanHandler,
);
pesananBahanRoutes.post(
  '/:id/receive',
  requireRole('admin'),
  validate('param', pesananBahanIdParamSchema),
  validate('json', receivePesananBahanSchema),
  receivePesananBahanHandler,
);
pesananBahanRoutes.post(
  '/:id/cancel',
  requireRole('admin'),
  validate('param', pesananBahanIdParamSchema),
  cancelPesananBahanHandler,
);
