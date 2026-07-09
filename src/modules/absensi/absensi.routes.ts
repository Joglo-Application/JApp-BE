import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { listAbsensiQuerySchema } from './absensi.schema';
import { checkInHandler, checkOutHandler, listAbsensiHandler } from './absensi.handler';
import type { AppBindings } from '@/types/hono';

export const absensiRoutes = new Hono<AppBindings>();

absensiRoutes.use('*', authMiddleware);

// Absen masuk/keluar — semua karyawan (mencatat absensi dirinya sendiri).
absensiRoutes.post('/masuk', checkInHandler);
absensiRoutes.post('/keluar', checkOutHandler);

// GET /absensi?date= — rekap untuk SPV/owner/admin.
absensiRoutes.get(
  '/',
  requireRole('admin', 'owner', 'supervisor'),
  validate('query', listAbsensiQuerySchema),
  listAbsensiHandler,
);
