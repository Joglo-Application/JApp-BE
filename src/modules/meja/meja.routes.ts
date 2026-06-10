import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createMejaSchema,
  listMejaQuerySchema,
  mejaIdParamSchema,
  updateMejaSchema,
  updateMejaStatusSchema,
} from './meja.schema';
import {
  createMejaHandler,
  deleteMejaHandler,
  getMejaHandler,
  listMejaHandler,
  updateMejaHandler,
  updateMejaStatusHandler,
} from './meja.handler';
import type { AppBindings } from '@/types/hono';

export const mejaRoutes = new Hono<AppBindings>();

mejaRoutes.use('*', authMiddleware);

// Read: semua role
mejaRoutes.get('/', validate('query', listMejaQuerySchema), listMejaHandler);
mejaRoutes.get('/:id', validate('param', mejaIdParamSchema), getMejaHandler);

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
