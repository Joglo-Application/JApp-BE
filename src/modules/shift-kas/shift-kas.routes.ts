import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createEntrySchema,
  idParamSchema,
  listShiftQuerySchema,
  startShiftSchema,
  updateEntrySchema,
} from './shift-kas.schema';
import * as h from './shift-kas.handler';
import type { AppBindings } from '@/types/hono';

export const shiftKasRoutes = new Hono<AppBindings>();

shiftKasRoutes.use('*', authMiddleware);

// GET /shift-kas/aktif — shift open milik user login (restore state). Static → daftar dulu.
shiftKasRoutes.get('/aktif', requireRole('admin', 'kasir'), h.getActiveShiftHandler);

// GET /shift-kas?date= — riwayat. Kasir lihat miliknya; admin/owner/spv semua.
shiftKasRoutes.get(
  '/',
  requireRole('admin', 'owner', 'kasir', 'supervisor'),
  validate('query', listShiftQuerySchema),
  h.listShiftHandler,
);

// POST /shift-kas — mulai shift.
shiftKasRoutes.post(
  '/',
  requireRole('admin', 'kasir'),
  validate('json', startShiftSchema),
  h.startShiftHandler,
);

// Entry (edit/hapus) — segmen 'entry' statis, tak bentrok dengan /:id.
shiftKasRoutes.patch(
  '/entry/:id',
  requireRole('admin', 'kasir'),
  validate('param', idParamSchema),
  validate('json', updateEntrySchema),
  h.updateEntryHandler,
);
shiftKasRoutes.delete(
  '/entry/:id',
  requireRole('admin', 'kasir'),
  validate('param', idParamSchema),
  h.deleteEntryHandler,
);

// GET /shift-kas/:id — detail shift.
shiftKasRoutes.get(
  '/:id',
  requireRole('admin', 'owner', 'kasir', 'supervisor'),
  validate('param', idParamSchema),
  h.getShiftHandler,
);

// POST /shift-kas/:id/entry — tambah setoran/penarikan.
shiftKasRoutes.post(
  '/:id/entry',
  requireRole('admin', 'kasir'),
  validate('param', idParamSchema),
  validate('json', createEntrySchema),
  h.addEntryHandler,
);

// POST /shift-kas/:id/tutup — tutup shift.
shiftKasRoutes.post(
  '/:id/tutup',
  requireRole('admin', 'kasir'),
  validate('param', idParamSchema),
  h.closeShiftHandler,
);
