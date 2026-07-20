import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { grupParamSchema } from './pengaturan.schema';
import {
  getGrupHandler,
  getSemuaHandler,
  simpanGrupHandler,
} from './pengaturan.handler';
import type { AppBindings } from '@/types/hono';

export const pengaturanRoutes = new Hono<AppBindings>();

pengaturanRoutes.use('*', authMiddleware);

// Baca: semua role (POS butuh nama toko, pajak, mata uang, printer).
pengaturanRoutes.get('/', getSemuaHandler);
pengaturanRoutes.get('/:grup', validate('param', grupParamSchema), getGrupHandler);

// Ubah: owner/admin saja.
pengaturanRoutes.put(
  '/:grup',
  requireRole('admin', 'owner'),
  validate('param', grupParamSchema),
  simpanGrupHandler,
);
