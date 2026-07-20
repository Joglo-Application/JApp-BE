import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createStokKeluarSchema,
  createStokMasukSchema,
  idParamSchema,
  rentangQuerySchema,
} from './stok-mutasi.schema';
import * as h from './stok-mutasi.handler';
import type { AppBindings } from '@/types/hono';

/** Dokumen mutasi stok dikelola gudang, owner, dan admin. */
const kelola = requireRole('admin', 'owner', 'gudang');

// --------------------------------------------------------- /stok-masuk
export const stokMasukRoutes = new Hono<AppBindings>();
stokMasukRoutes.use('*', authMiddleware);
stokMasukRoutes.get('/', validate('query', rentangQuerySchema), h.listMasukHandler);
stokMasukRoutes.post('/', kelola, validate('json', createStokMasukSchema), h.createMasukHandler);
stokMasukRoutes.post(
  '/:id/posting',
  kelola,
  validate('param', idParamSchema),
  h.postingMasukHandler,
);
stokMasukRoutes.post('/:id/batal', kelola, validate('param', idParamSchema), h.batalMasukHandler);

// -------------------------------------------------------- /stok-keluar
export const stokKeluarRoutes = new Hono<AppBindings>();
stokKeluarRoutes.use('*', authMiddleware);
stokKeluarRoutes.get('/', validate('query', rentangQuerySchema), h.listKeluarHandler);
stokKeluarRoutes.post('/', kelola, validate('json', createStokKeluarSchema), h.createKeluarHandler);
stokKeluarRoutes.post(
  '/:id/posting',
  kelola,
  validate('param', idParamSchema),
  h.postingKeluarHandler,
);
stokKeluarRoutes.post('/:id/batal', kelola, validate('param', idParamSchema), h.batalKeluarHandler);
