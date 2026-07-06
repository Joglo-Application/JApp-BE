import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { createLogSchema, listLogQuerySchema } from './log-transaksi.schema';
import { createLogHandler, listLogHandler } from './log-transaksi.handler';
import type { AppBindings } from '@/types/hono';

export const logTransaksiRoutes = new Hono<AppBindings>();

logTransaksiRoutes.use('*', authMiddleware);

// POST /log-transaksi — catat satu aksi POS (kasir/admin).
logTransaksiRoutes.post(
  '/',
  requireRole('admin', 'kasir'),
  validate('json', createLogSchema),
  createLogHandler,
);

// GET /log-transaksi?date=YYYY-MM-DD&tipe=ADD_QTY — daftar untuk panel Laporan.
logTransaksiRoutes.get(
  '/',
  requireRole('admin', 'owner', 'kasir'),
  validate('query', listLogQuerySchema),
  listLogHandler,
);
