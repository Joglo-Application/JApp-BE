import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createAreaSchema,
  createKategoriSchema,
  createMetodeSchema,
  idParamSchema,
  listKategoriQuerySchema,
  updateAreaSchema,
  updateKategoriSchema,
  updateMetodeSchema,
} from './master.schema';
import * as h from './master.handler';
import type { AppBindings } from '@/types/hono';

/** Kelola master data: owner/admin. Baca: semua role. */
const kelola = requireRole('admin', 'owner');

/** Kategori juga boleh dikelola gudang (mengurus kategori stok gudang). */
const kelolaKategori = requireRole('admin', 'owner', 'gudang');

// ---------------------------------------------------------------- /area
export const areaRoutes = new Hono<AppBindings>();
areaRoutes.use('*', authMiddleware);
areaRoutes.get('/', h.listAreaHandler);
areaRoutes.post('/', kelola, validate('json', createAreaSchema), h.createAreaHandler);
areaRoutes.patch(
  '/:id',
  kelola,
  validate('param', idParamSchema),
  validate('json', updateAreaSchema),
  h.updateAreaHandler,
);
areaRoutes.delete('/:id', kelola, validate('param', idParamSchema), h.deleteAreaHandler);

// ------------------------------------------------------------ /kategori
export const kategoriRoutes = new Hono<AppBindings>();
kategoriRoutes.use('*', authMiddleware);
kategoriRoutes.get('/', validate('query', listKategoriQuerySchema), h.listKategoriHandler);
kategoriRoutes.post('/', kelolaKategori, validate('json', createKategoriSchema), h.createKategoriHandler);
kategoriRoutes.patch(
  '/:id',
  kelolaKategori,
  validate('param', idParamSchema),
  validate('json', updateKategoriSchema),
  h.updateKategoriHandler,
);
kategoriRoutes.delete('/:id', kelolaKategori, validate('param', idParamSchema), h.deleteKategoriHandler);

// --------------------------------------------------- /metode-pembayaran
export const metodePembayaranRoutes = new Hono<AppBindings>();
metodePembayaranRoutes.use('*', authMiddleware);
metodePembayaranRoutes.get('/', h.listMetodeHandler);
metodePembayaranRoutes.post('/', kelola, validate('json', createMetodeSchema), h.createMetodeHandler);
metodePembayaranRoutes.patch(
  '/:id',
  kelola,
  validate('param', idParamSchema),
  validate('json', updateMetodeSchema),
  h.updateMetodeHandler,
);
metodePembayaranRoutes.delete(
  '/:id',
  kelola,
  validate('param', idParamSchema),
  h.deleteMetodeHandler,
);
