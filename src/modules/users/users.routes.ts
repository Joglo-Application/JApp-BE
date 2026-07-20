import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { paginationQuerySchema } from '@/shared/pagination';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schema';
import {
  createUserHandler,
  deleteUserHandler,
  exportUsersHandler,
  getUserHandler,
  listUsersHandler,
  updateUserHandler,
} from './users.handler';
import type { AppBindings } from '@/types/hono';

export const usersRoutes = new Hono<AppBindings>();

// Admin & owner boleh kelola pegawai. Owner dibatasi (tak bisa sentuh akun/role
// admin) di lapisan service.
usersRoutes.use('*', authMiddleware, requireRole('admin', 'owner'));

usersRoutes.get('/', validate('query', paginationQuerySchema), listUsersHandler);
// Didaftarkan sebelum '/:id' agar "export" tidak tertangkap sebagai id.
usersRoutes.get('/export', exportUsersHandler);
usersRoutes.get('/:id', validate('param', userIdParamSchema), getUserHandler);
usersRoutes.post('/', validate('json', createUserSchema), createUserHandler);
usersRoutes.patch(
  '/:id',
  validate('param', userIdParamSchema),
  validate('json', updateUserSchema),
  updateUserHandler,
);
usersRoutes.delete('/:id', validate('param', userIdParamSchema), deleteUserHandler);
