import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  returTransaksiSchema,
  transaksiKodeParamSchema,
  transaksiQuerySchema,
} from './transaksi.schema';
import { listTransaksiHandler, returTransaksiHandler } from './transaksi.handler';
import type { AppBindings } from '@/types/hono';

export const transaksiRoutes = new Hono<AppBindings>();

transaksiRoutes.use('*', authMiddleware);

// GET /transaksi?date=YYYY-MM-DD — riwayat transaksi (read-only, semua role).
transaksiRoutes.get('/', validate('query', transaksiQuerySchema), listTransaksiHandler);

// POST /transaksi/:kode/retur — retur transaksi. Semua role boleh memanggil,
// tapi wajib menyertakan PIN supervisor yang diverifikasi server-side.
transaksiRoutes.post(
  '/:kode/retur',
  validate('param', transaksiKodeParamSchema),
  validate('json', returTransaksiSchema),
  returTransaksiHandler,
);
