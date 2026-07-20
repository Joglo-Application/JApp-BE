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
import { shiftKasRoutes } from '@/modules/shift-kas/shift-kas.routes';
import { logGudangRoutes } from '@/modules/log-gudang/log-gudang.routes';
import { absensiRoutes } from '@/modules/absensi/absensi.routes';
import { promoRoutes } from '@/modules/promo/promo.routes';
import { loyaltyRoutes } from '@/modules/loyalty/loyalty.routes';
import { laporanRoutes } from '@/modules/laporan/laporan.routes';
import { pengaturanRoutes } from '@/modules/pengaturan/pengaturan.routes';
import {
  areaRoutes,
  kategoriRoutes,
  metodePembayaranRoutes,
} from '@/modules/master/master.routes';
import {
  produksiStokRoutes,
  stokOpnameRoutes,
} from '@/modules/stok-dokumen/stok-dokumen.routes';
import {
  stokKeluarRoutes,
  stokMasukRoutes,
} from '@/modules/stok-mutasi/stok-mutasi.routes';
import { uploadRoutes } from '@/modules/upload/upload.routes';
import { serveStatic } from '@hono/node-server/serve-static';
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
  api.route('/shift-kas', shiftKasRoutes);
  api.route('/log-gudang', logGudangRoutes);
  api.route('/absensi', absensiRoutes);
  api.route('/promo', promoRoutes);
  api.route('/loyalty', loyaltyRoutes);
  api.route('/laporan', laporanRoutes);
  api.route('/pengaturan', pengaturanRoutes);
  api.route('/area', areaRoutes);
  api.route('/kategori', kategoriRoutes);
  api.route('/metode-pembayaran', metodePembayaranRoutes);
  api.route('/stok-opname', stokOpnameRoutes);
  api.route('/produksi-stok', produksiStokRoutes);
  api.route('/stok-masuk', stokMasukRoutes);
  api.route('/stok-keluar', stokKeluarRoutes);
  api.route('/upload', uploadRoutes);

  app.route('/api/v1', api);
  app.route('/docs', docsRoutes);
  // Gambar hasil unggahan disajikan statis dari direktori `uploads/`.
  app.use('/uploads/*', serveStatic({ root: './' }));

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}
