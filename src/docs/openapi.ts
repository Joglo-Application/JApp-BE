import { schemas, securitySchemes } from './components';
import { healthPaths } from './paths/health';
import { authPaths } from './paths/auth';
import { usersPaths } from './paths/users';
import { bahanBakuPaths } from './paths/bahan-baku';
import { suppliersPaths } from './paths/suppliers';
import { menusPaths } from './paths/menus';
import { pesananPaths } from './paths/pesanan';
import { pembayaranPaths } from './paths/pembayaran';
import { pesananBahanPaths } from './paths/pesanan-bahan';
import { transaksiMasukPaths } from './paths/transaksi-masuk';
import { transaksiKeluarPaths } from './paths/transaksi-keluar';
import { mejaPaths } from './paths/meja';
import { memberPaths } from './paths/member';
import { transaksiPaths } from './paths/transaksi';
import { inventoriPaths } from './paths/inventori';
import { stokGudangPaths } from './paths/stok-gudang';
import { kitchenPaths } from './paths/kitchen';
import { logTransaksiPaths } from './paths/log-transaksi';
import { shiftKasPaths } from './paths/shift-kas';
import { logGudangPaths } from './paths/log-gudang';
import { absensiPaths } from './paths/absensi';
// import { env } from '@/config/env';

export function getOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'POS API',
      version: '0.1.0',
      description: [
        'Backend REST API untuk aplikasi Point of Sale (POS) berbasis mobile.',
        '',
        '## Autentikasi',
        'Semua endpoint kecuali `/health` dan `/auth/login` membutuhkan JWT token.',
        'Login dulu via `POST /auth/login` lalu klik tombol **Authorize** di kanan atas.',
        '',
        '## Default Credentials (Development)',
        'Akun hasil seed (password = `<role>123`):',
        '- **Admin:** `admin` / `admin123`',
        '- **Kasir:** `kasir1` / `kasir123`',
        // '- **Owner:** `owner1` / `owner123`',
        '- **Dapur:** `dapur1` / `dapur123`',
        '- **Supervisor:** `supervisor1` / `supervisor123`',
        '- **Gudang:** `gudang1` / `gudang123`',
        // '',
        // '## Status Roadmap',
        // '- ✅ Phase 1-5: Setup, Auth, Master Data',
        // '- 🔜 Phase 6: POS Core (Pesanan + Pembayaran)',
        // '- 🔜 Phase 7: Inventory (PO + Transaksi Bahan)',
        // '- 🔜 Phase 8: Laporan + Reports',
      ].join('\n'),
      contact: { name: 'POS API Team' },
    },
    // NOTE: kept so "Try it out" uses the /api/v1 base path. The Servers
    // dropdown itself is hidden via CSS in docs.routes.ts.
    servers: [{ url: '/api/v1' }],
    tags: [
      { name: 'Health', description: 'Server healthcheck' },
      { name: 'Auth', description: 'Login & user info' },
      { name: 'Users', description: 'Manajemen user (admin only)' },
      { name: 'Bahan Baku', description: 'Master data bahan baku' },
      { name: 'Suppliers', description: 'Master data supplier' },
      { name: 'Menus', description: 'Master data menu jual' },
      { name: 'Resep Menu', description: 'Komposisi bahan per menu (sub-resource)' },
      { name: 'Pesanan', description: 'Transaksi penjualan POS (auto-deduct stok)' },
      { name: 'Pembayaran', description: 'Pembayaran pesanan' },
      { name: 'Pesanan Bahan (PO)', description: 'Purchase order ke supplier' },
      { name: 'Transaksi Masuk', description: 'Penerimaan bahan baku (stok bertambah)' },
      { name: 'Transaksi Keluar', description: 'Pengeluaran bahan (penjualan + waste/adjustment)' },
      { name: 'Meja', description: 'Manajemen meja & status' },
      { name: 'Member', description: 'Member / loyalty & poin' },
      { name: 'Transaksi', description: 'Riwayat transaksi penjualan (read-only, untuk FE)' },
      { name: 'Inventori', description: 'Stok produk untuk POS (dari menu)' },
      { name: 'Stok Gudang', description: 'Stok bahan baku untuk owner' },
      { name: 'Kitchen', description: 'Order aktif untuk dapur' },
      { name: 'Shift Kas', description: 'Shift kas kasir (kas awal, setoran/penarikan, tutup)' },
      { name: 'Log Gudang', description: 'Audit log operasi stok gudang' },
      { name: 'Absensi', description: 'Absensi karyawan (masuk/keluar)' },
    ],
    paths: {
      ...healthPaths,
      ...authPaths,
      ...usersPaths,
      ...bahanBakuPaths,
      ...suppliersPaths,
      ...menusPaths,
      ...pesananPaths,
      ...pembayaranPaths,
      ...pesananBahanPaths,
      ...transaksiMasukPaths,
      ...transaksiKeluarPaths,
      ...mejaPaths,
      ...memberPaths,
      ...transaksiPaths,
      ...inventoriPaths,
      ...stokGudangPaths,
      ...kitchenPaths,
      ...logTransaksiPaths,
      ...shiftKasPaths,
      ...logGudangPaths,
      ...absensiPaths,
    },
    components: {
      securitySchemes,
      schemas,
    },
    security: [{ bearerAuth: [] }],
  };
}
