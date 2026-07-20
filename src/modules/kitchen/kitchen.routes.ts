import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { kitchenItemParamSchema, kitchenOrdersQuerySchema } from './kitchen.schema';
import {
  completeKitchenOrderHandler,
  listKitchenOrdersHandler,
  setKitchenItemDoneHandler,
} from './kitchen.handler';
import type { AppBindings } from '@/types/hono';

export const kitchenRoutes = new Hono<AppBindings>();

kitchenRoutes.use('*', authMiddleware);

// GET /kitchen/orders?date= — order aktif (in_progress) untuk layar dapur.
kitchenRoutes.get('/orders', validate('query', kitchenOrdersQuerySchema), listKitchenOrdersHandler);

// PATCH /kitchen/orders/:id/items/:detailId/done — centang satu item.
kitchenRoutes.patch(
  '/orders/:id/items/:detailId/done',
  requireRole('admin', 'dapur'),
  validate('param', kitchenItemParamSchema),
  setKitchenItemDoneHandler,
);

// PATCH /kitchen/orders/:id/done — dapur menyelesaikan pesanan (non Dine-In).
kitchenRoutes.patch(
  '/orders/:id/done',
  requireRole('admin', 'dapur'),
  completeKitchenOrderHandler,
);
