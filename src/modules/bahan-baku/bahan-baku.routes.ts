import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { paginationQuerySchema } from '@/shared/pagination';
import {
  bahanIdParamSchema,
  createBahanBakuSchema,
  updateBahanBakuSchema,
} from './bahan-baku.schema';
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  updateHandler,
} from './bahan-baku.handler';
import type { AppBindings } from '@/types/hono';

export const bahanBakuRoutes = new Hono<AppBindings>();

// Semua endpoint butuh login
bahanBakuRoutes.use('*', authMiddleware);

// Read: semua role (admin, kasir, owner)
bahanBakuRoutes.get('/', validate('query', paginationQuerySchema), listHandler);
bahanBakuRoutes.get('/:id', validate('param', bahanIdParamSchema), getHandler);

// Write (tambah/edit stok): admin + gudang (pengelola Stok Gudang / "supplier" di FE)
bahanBakuRoutes.post(
  '/',
  requireRole('admin', 'gudang'),
  validate('json', createBahanBakuSchema),
  createHandler,
);
bahanBakuRoutes.patch(
  '/:id',
  requireRole('admin', 'gudang'),
  validate('param', bahanIdParamSchema),
  validate('json', updateBahanBakuSchema),
  updateHandler,
);
// Hapus bahan: admin only (lebih sensitif)
bahanBakuRoutes.delete(
  '/:id',
  requireRole('admin'),
  validate('param', bahanIdParamSchema),
  deleteHandler,
);
