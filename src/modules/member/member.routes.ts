import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  adjustPoinSchema,
  createMemberSchema,
  listMemberQuerySchema,
  memberIdParamSchema,
  updateMemberSchema,
} from './member.schema';
import {
  adjustPoinHandler,
  createMemberHandler,
  deleteMemberHandler,
  getMemberHandler,
  listMemberHandler,
  listTransaksiMemberHandler,
  updateMemberHandler,
} from './member.handler';
import type { AppBindings } from '@/types/hono';

export const memberRoutes = new Hono<AppBindings>();

memberRoutes.use('*', authMiddleware);

// Read: semua role (kasir butuh cari member saat transaksi)
memberRoutes.get('/', validate('query', listMemberQuerySchema), listMemberHandler);
memberRoutes.get('/:id', validate('param', memberIdParamSchema), getMemberHandler);

// GET /member/:id/transaksi — riwayat transaksi member (tab Riwayat di POS).
memberRoutes.get(
  '/:id/transaksi',
  validate('param', memberIdParamSchema),
  listTransaksiMemberHandler,
);

// Tulis: admin & kasir (kasir bisa daftarkan member baru & atur poin saat transaksi)
memberRoutes.post(
  '/',
  requireRole('admin', 'kasir'),
  validate('json', createMemberSchema),
  createMemberHandler,
);
memberRoutes.post(
  '/:id/poin',
  requireRole('admin', 'kasir'),
  validate('param', memberIdParamSchema),
  validate('json', adjustPoinSchema),
  adjustPoinHandler,
);
memberRoutes.patch(
  '/:id',
  requireRole('admin'),
  validate('param', memberIdParamSchema),
  validate('json', updateMemberSchema),
  updateMemberHandler,
);
memberRoutes.delete(
  '/:id',
  requireRole('admin'),
  validate('param', memberIdParamSchema),
  deleteMemberHandler,
);
