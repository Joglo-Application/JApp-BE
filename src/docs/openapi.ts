import { schemas, securitySchemes } from './components';
import { healthPaths } from './paths/health';
import { authPaths } from './paths/auth';
import { usersPaths } from './paths/users';
import { bahanBakuPaths } from './paths/bahan-baku';
import { suppliersPaths } from './paths/suppliers';
import { menusPaths } from './paths/menus';
import { env } from '@/config/env';

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
        '- **Admin:** `admin` / `admin123`',
        '- **Kasir:** `kasir1` / `kasir123`',
        '',
        '## Status Roadmap',
        '- ✅ Phase 1-5: Setup, Auth, Master Data',
        '- 🔜 Phase 6: POS Core (Pesanan + Pembayaran)',
        '- 🔜 Phase 7: Inventory (PO + Transaksi Bahan)',
        '- 🔜 Phase 8: Laporan + Reports',
      ].join('\n'),
      contact: { name: 'POS API Team' },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local development',
      },
    ],
    tags: [
      { name: 'Health', description: 'Server healthcheck' },
      { name: 'Auth', description: 'Login & user info' },
      { name: 'Users', description: 'Manajemen user (admin only)' },
      { name: 'Bahan Baku', description: 'Master data bahan baku' },
      { name: 'Suppliers', description: 'Master data supplier' },
      { name: 'Menus', description: 'Master data menu jual' },
      { name: 'Resep Menu', description: 'Komposisi bahan per menu (sub-resource)' },
    ],
    paths: {
      ...healthPaths,
      ...authPaths,
      ...usersPaths,
      ...bahanBakuPaths,
      ...suppliersPaths,
      ...menusPaths,
    },
    components: {
      securitySchemes,
      schemas,
    },
    security: [{ bearerAuth: [] }],
  };
}
