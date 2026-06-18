import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { transaksiQuerySchema } from './transaksi.schema';
import { listTransaksiHandler } from './transaksi.handler';
import type { AppBindings } from '@/types/hono';

export const transaksiRoutes = new Hono<AppBindings>();

transaksiRoutes.use('*', authMiddleware);

// GET /transaksi?date=YYYY-MM-DD — riwayat transaksi (read-only, semua role).
transaksiRoutes.get('/', validate('query', transaksiQuerySchema), listTransaksiHandler);
