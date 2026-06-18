import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { listInventoriHandler } from './inventori.handler';
import type { AppBindings } from '@/types/hono';

export const inventoriRoutes = new Hono<AppBindings>();

inventoriRoutes.use('*', authMiddleware);

// GET /inventori — stok produk untuk POS (read-only, semua role).
inventoriRoutes.get('/', listInventoriHandler);
