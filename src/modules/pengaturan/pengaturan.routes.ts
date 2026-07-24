import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { grupParamSchema, ubahPajakCepatSchema } from './pengaturan.schema';
import {
  getGrupHandler,
  getSemuaHandler,
  simpanGrupHandler,
  ubahPajakCepatHandler,
} from './pengaturan.handler';
import type { AppBindings } from '@/types/hono';

export const pengaturanRoutes = new Hono<AppBindings>();

pengaturanRoutes.use('*', authMiddleware);

// Baca: semua role (POS butuh nama toko, pajak, mata uang, printer).
pengaturanRoutes.get('/', getSemuaHandler);
pengaturanRoutes.get('/:grup', validate('param', grupParamSchema), getGrupHandler);

// Ubah cepat tarif pajak dari POS — disetujui PIN supervisor (semua role login),
// bukan role owner/admin. Didaftarkan sebelum PUT /:grup.
pengaturanRoutes.put(
  '/pajak/cepat',
  validate('json', ubahPajakCepatSchema),
  ubahPajakCepatHandler,
);

// Ubah: owner/admin saja.
pengaturanRoutes.put(
  '/:grup',
  requireRole('admin', 'owner'),
  validate('param', grupParamSchema),
  simpanGrupHandler,
);
