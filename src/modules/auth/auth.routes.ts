import { Hono } from 'hono';
import { validate } from '@/middlewares/validation.middleware';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { loginSchema, verifyPinSchema } from './auth.schema';
import { loginHandler, meHandler, verifyPinHandler } from './auth.handler';
import type { AppBindings } from '@/types/hono';

export const authRoutes = new Hono<AppBindings>();

authRoutes.post('/login', validate('json', loginSchema), loginHandler);
authRoutes.get('/me', authMiddleware, meHandler);

// Verifikasi PIN persetujuan supervisor (menggantikan PIN hardcoded di klien).
authRoutes.post(
  '/verify-pin',
  authMiddleware,
  validate('json', verifyPinSchema),
  verifyPinHandler,
);
