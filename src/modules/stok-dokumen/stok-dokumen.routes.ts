import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createOpnameSchema,
  createProduksiSchema,
  idParamSchema,
  rentangQuerySchema,
} from './stok-dokumen.schema';
import * as h from './stok-dokumen.handler';
import type { AppBindings } from '@/types/hono';

/** Dokumen stok dikelola gudang, owner, dan admin. */
const kelola = requireRole('admin', 'owner', 'gudang');

// -------------------------------------------------------- /stok-opname
export const stokOpnameRoutes = new Hono<AppBindings>();
stokOpnameRoutes.use('*', authMiddleware);
stokOpnameRoutes.get('/', validate('query', rentangQuerySchema), h.listOpnameHandler);
stokOpnameRoutes.post('/', kelola, validate('json', createOpnameSchema), h.createOpnameHandler);
stokOpnameRoutes.post(
  '/:id/posting',
  kelola,
  validate('param', idParamSchema),
  h.postingOpnameHandler,
);
stokOpnameRoutes.post('/:id/batal', kelola, validate('param', idParamSchema), h.batalOpnameHandler);

// ------------------------------------------------------ /produksi-stok
export const produksiStokRoutes = new Hono<AppBindings>();
produksiStokRoutes.use('*', authMiddleware);
produksiStokRoutes.get('/', validate('query', rentangQuerySchema), h.listProduksiHandler);
produksiStokRoutes.post('/', kelola, validate('json', createProduksiSchema), h.createProduksiHandler);
produksiStokRoutes.post(
  '/:id/posting',
  kelola,
  validate('param', idParamSchema),
  h.postingProduksiHandler,
);
produksiStokRoutes.post(
  '/:id/batal',
  kelola,
  validate('param', idParamSchema),
  h.batalProduksiHandler,
);
