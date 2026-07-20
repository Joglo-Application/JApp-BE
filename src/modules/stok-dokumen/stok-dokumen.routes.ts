import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createOpnameSchema,
  createProduksiSchema,
  rentangQuerySchema,
} from './stok-dokumen.schema';
import {
  createOpnameHandler,
  createProduksiHandler,
  listOpnameHandler,
  listProduksiHandler,
} from './stok-dokumen.handler';
import type { AppBindings } from '@/types/hono';

/** Dokumen stok dikelola gudang, owner, dan admin. */
const kelola = requireRole('admin', 'owner', 'gudang');

// -------------------------------------------------------- /stok-opname
export const stokOpnameRoutes = new Hono<AppBindings>();
stokOpnameRoutes.use('*', authMiddleware);
stokOpnameRoutes.get('/', validate('query', rentangQuerySchema), listOpnameHandler);
stokOpnameRoutes.post('/', kelola, validate('json', createOpnameSchema), createOpnameHandler);

// ------------------------------------------------------ /produksi-stok
export const produksiStokRoutes = new Hono<AppBindings>();
produksiStokRoutes.use('*', authMiddleware);
produksiStokRoutes.get('/', validate('query', rentangQuerySchema), listProduksiHandler);
produksiStokRoutes.post('/', kelola, validate('json', createProduksiSchema), createProduksiHandler);
