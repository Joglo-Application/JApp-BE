import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { listStokGudangHandler } from './stok-gudang.handler';
import type { AppBindings } from '@/types/hono';

export const stokGudangRoutes = new Hono<AppBindings>();

stokGudangRoutes.use('*', authMiddleware);

// GET /stok-gudang — stok bahan baku untuk owner (read-only, semua role).
stokGudangRoutes.get('/', listStokGudangHandler);
