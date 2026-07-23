import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { paginationQuerySchema } from '@/shared/pagination';
import {
  bahanIdParamSchema,
  createBahanBakuSchema,
  tambahStokSchema,
  updateBahanBakuSchema,
} from './bahan-baku.schema';
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  tambahStokHandler,
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
// Tambah stok atomik (halaman "Tambah Stok Gudang"): admin + gudang
bahanBakuRoutes.patch(
  '/:id/tambah-stok',
  requireRole('admin', 'gudang'),
  validate('param', bahanIdParamSchema),
  validate('json', tambahStokSchema),
  tambahStokHandler,
);

// Hapus bahan: admin + gudang (pengelola stok gudang).
bahanBakuRoutes.delete(
  '/:id',
  requireRole('admin', 'gudang'),
  validate('param', bahanIdParamSchema),
  deleteHandler,
);
