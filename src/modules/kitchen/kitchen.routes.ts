import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { listKitchenOrdersHandler } from './kitchen.handler';
import type { AppBindings } from '@/types/hono';

export const kitchenRoutes = new Hono<AppBindings>();

kitchenRoutes.use('*', authMiddleware);

// GET /kitchen/orders — order aktif (pesanan pending) untuk layar dapur.
kitchenRoutes.get('/orders', listKitchenOrdersHandler);
