import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createPromoSchema,
  listPromoQuerySchema,
  promoIdParamSchema,
  updatePromoSchema,
  validatePromoSchema,
} from './promo.schema';
import {
  createHandler,
  deleteHandler,
  listHandler,
  updateHandler,
  validateHandler,
} from './promo.handler';
import type { AppBindings } from '@/types/hono';

export const promoRoutes = new Hono<AppBindings>();

promoRoutes.use('*', authMiddleware);

// GET /promo — daftar promo berlaku (POS). ?all=true untuk layar owner.
promoRoutes.get('/', validate('query', listPromoQuerySchema), listHandler);

// POST /promo/validate — validasi kode & hitung potongan (semua role kasir).
promoRoutes.post('/validate', validate('json', validatePromoSchema), validateHandler);

// Kelola master promo — owner/admin.
promoRoutes.post(
  '/',
  requireRole('admin', 'owner'),
  validate('json', createPromoSchema),
  createHandler,
);
promoRoutes.patch(
  '/:id',
  requireRole('admin', 'owner'),
  validate('param', promoIdParamSchema),
  validate('json', updatePromoSchema),
  updateHandler,
);
promoRoutes.delete(
  '/:id',
  requireRole('admin', 'owner'),
  validate('param', promoIdParamSchema),
  deleteHandler,
);
