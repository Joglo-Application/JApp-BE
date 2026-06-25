import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import {
  completeKitchenOrderHandler,
  listKitchenOrdersHandler,
} from './kitchen.handler';
import type { AppBindings } from '@/types/hono';

export const kitchenRoutes = new Hono<AppBindings>();

kitchenRoutes.use('*', authMiddleware);

// GET /kitchen/orders — order aktif (in_progress) untuk layar dapur.
kitchenRoutes.get('/orders', listKitchenOrdersHandler);

// PATCH /kitchen/orders/:id/done — dapur menyelesaikan pesanan (non Dine-In).
kitchenRoutes.patch(
  '/orders/:id/done',
  requireRole('admin', 'dapur'),
  completeKitchenOrderHandler,
);
