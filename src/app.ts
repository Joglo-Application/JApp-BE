import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';
import { loggerMiddleware } from '@/middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { authRoutes } from '@/modules/auth/auth.routes';
import { usersRoutes } from '@/modules/users/users.routes';
import { bahanBakuRoutes } from '@/modules/bahan-baku/bahan-baku.routes';
import { suppliersRoutes } from '@/modules/suppliers/suppliers.routes';
import { menusRoutes } from '@/modules/menus/menus.routes';
import { pesananRoutes } from '@/modules/pesanan/pesanan.routes';
import { pembayaranRoutes } from '@/modules/pembayaran/pembayaran.routes';
import { pesananBahanRoutes } from '@/modules/pesanan-bahan/pesanan-bahan.routes';
import { transaksiMasukRoutes } from '@/modules/transaksi-masuk/transaksi-masuk.routes';
import { transaksiKeluarRoutes } from '@/modules/transaksi-keluar/transaksi-keluar.routes';
import { mejaRoutes } from '@/modules/meja/meja.routes';
import { memberRoutes } from '@/modules/member/member.routes';
import { transaksiRoutes } from '@/modules/transaksi/transaksi.routes';
import { inventoriRoutes } from '@/modules/inventori/inventori.routes';
import { stokGudangRoutes } from '@/modules/stok-gudang/stok-gudang.routes';
import { kitchenRoutes } from '@/modules/kitchen/kitchen.routes';
import { logTransaksiRoutes } from '@/modules/log-transaksi/log-transaksi.routes';
import { docsRoutes } from '@/docs/docs.routes';
import { success } from '@/shared/response';
import { env } from '@/config/env';
import type { AppBindings } from '@/types/hono';

export function createApp(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.use('*', requestIdMiddleware);
  app.use('*', loggerMiddleware);
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      exposeHeaders: ['x-request-id'],
      maxAge: 86400,
    }),
  );

  const api = new Hono<AppBindings>();

  api.get('/health', (c) => {
    return c.json(
      success({
        status: 'ok',
        service: env.APP_NAME,
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }),
    );
  });

  api.route('/auth', authRoutes);
  api.route('/users', usersRoutes);
  api.route('/bahan-baku', bahanBakuRoutes);
  api.route('/suppliers', suppliersRoutes);
  api.route('/menus', menusRoutes);
  api.route('/pesanan', pesananRoutes);
  api.route('/pembayaran', pembayaranRoutes);
  api.route('/pesanan-bahan', pesananBahanRoutes);
  api.route('/transaksi-masuk', transaksiMasukRoutes);
  api.route('/transaksi-keluar', transaksiKeluarRoutes);
  api.route('/meja', mejaRoutes);
  api.route('/member', memberRoutes);
  api.route('/transaksi', transaksiRoutes);
  api.route('/inventori', inventoriRoutes);
  api.route('/stok-gudang', stokGudangRoutes);
  api.route('/kitchen', kitchenRoutes);
  api.route('/log-transaksi', logTransaksiRoutes);

  app.route('/api/v1', api);
  app.route('/docs', docsRoutes);

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}
