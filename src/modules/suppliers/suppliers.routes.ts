import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { paginationQuerySchema } from '@/shared/pagination';
import {
  createSupplierSchema,
  supplierIdParamSchema,
  updateSupplierSchema,
} from './suppliers.schema';
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  updateHandler,
} from './suppliers.handler';
import type { AppBindings } from '@/types/hono';

export const suppliersRoutes = new Hono<AppBindings>();

suppliersRoutes.use('*', authMiddleware);

suppliersRoutes.get('/', validate('query', paginationQuerySchema), listHandler);
suppliersRoutes.get('/:id', validate('param', supplierIdParamSchema), getHandler);

suppliersRoutes.post('/', requireRole('admin'), validate('json', createSupplierSchema), createHandler);
suppliersRoutes.patch(
  '/:id',
  requireRole('admin'),
  validate('param', supplierIdParamSchema),
  validate('json', updateSupplierSchema),
  updateHandler,
);
suppliersRoutes.delete(
  '/:id',
  requireRole('admin'),
  validate('param', supplierIdParamSchema),
  deleteHandler,
);
