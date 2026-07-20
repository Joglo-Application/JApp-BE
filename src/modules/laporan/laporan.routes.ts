import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { exportQuerySchema, rentangQuerySchema } from './laporan.schema';
import {
  dashboardHandler,
  exportHandler,
  guestHandler,
  pembayaranHandler,
  produkHandler,
  ringkasanHandler,
} from './laporan.handler';
import type { AppBindings } from '@/types/hono';

export const laporanRoutes = new Hono<AppBindings>();

laporanRoutes.use('*', authMiddleware);
// Laporan bersifat manajerial — kasir/dapur tidak diberi akses.
laporanRoutes.use('*', requireRole('admin', 'owner', 'supervisor'));

laporanRoutes.get('/ringkasan', validate('query', rentangQuerySchema), ringkasanHandler);
laporanRoutes.get('/produk', validate('query', rentangQuerySchema), produkHandler);
laporanRoutes.get('/pembayaran', validate('query', rentangQuerySchema), pembayaranHandler);
laporanRoutes.get('/guest', validate('query', rentangQuerySchema), guestHandler);
laporanRoutes.get('/dashboard', validate('query', rentangQuerySchema), dashboardHandler);

// GET /laporan/export?jenis=ringkasan|produk|pembayaran|guest — unduh CSV.
laporanRoutes.get('/export', validate('query', exportQuerySchema), exportHandler);
