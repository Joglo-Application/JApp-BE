import { Hono } from 'hono';
import { validate } from '@/middlewares/validation.middleware';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { loginSchema } from './auth.schema';
import { loginHandler, meHandler } from './auth.handler';
import type { AppBindings } from '@/types/hono';

export const authRoutes = new Hono<AppBindings>();

authRoutes.post('/login', validate('json', loginSchema), loginHandler);
authRoutes.get('/me', authMiddleware, meHandler);
