import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { paginationQuerySchema } from '@/shared/pagination';
import {
  createMenuSchema,
  createResepSchema,
  menuIdParamSchema,
  resepIdParamSchema,
  updateMenuSchema,
  updateResepSchema,
} from './menus.schema';
import {
  addResepHandler,
  createMenuHandler,
  deleteMenuHandler,
  deleteResepHandler,
  getMenuHandler,
  listMenusHandler,
  listResepHandler,
  updateMenuHandler,
  updateResepHandler,
} from './menus.handler';
import type { AppBindings } from '@/types/hono';

export const menusRoutes = new Hono<AppBindings>();

menusRoutes.use('*', authMiddleware);

// Menu CRUD
menusRoutes.get('/', validate('query', paginationQuerySchema), listMenusHandler);
menusRoutes.get('/:id', validate('param', menuIdParamSchema), getMenuHandler);
// Tab Inventori dimiliki role dapur, gudang, dan kasir: hanya mereka yang boleh
// membuat/mengubah produk. Role lain read-only (lihat
// auth_provider.canManageInventori di FE).
menusRoutes.post('/', requireRole('dapur', 'gudang', 'kasir'), validate('json', createMenuSchema), createMenuHandler);
menusRoutes.patch(
  '/:id',
  requireRole('dapur', 'gudang', 'kasir'),
  validate('param', menuIdParamSchema),
  validate('json', updateMenuSchema),
  updateMenuHandler,
);
menusRoutes.delete(
  '/:id',
  requireRole('admin', 'owner'),
  validate('param', menuIdParamSchema),
  deleteMenuHandler,
);

// Resep sub-resource
menusRoutes.get('/:id/resep', validate('param', menuIdParamSchema), listResepHandler);
menusRoutes.post(
  '/:id/resep',
  requireRole('admin', 'owner'),
  validate('param', menuIdParamSchema),
  validate('json', createResepSchema),
  addResepHandler,
);
menusRoutes.patch(
  '/:id/resep/:resepId',
  requireRole('admin', 'owner'),
  validate('param', resepIdParamSchema),
  validate('json', updateResepSchema),
  updateResepHandler,
);
menusRoutes.delete(
  '/:id/resep/:resepId',
  requireRole('admin', 'owner'),
  validate('param', resepIdParamSchema),
  deleteResepHandler,
);
