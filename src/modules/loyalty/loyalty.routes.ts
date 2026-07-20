import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  createRewardSchema,
  listRewardQuerySchema,
  redeemSchema,
  rewardIdParamSchema,
  updateRewardSchema,
} from './loyalty.schema';
import {
  createRewardHandler,
  deleteRewardHandler,
  listRewardsHandler,
  redeemHandler,
  updateRewardHandler,
} from './loyalty.handler';
import type { AppBindings } from '@/types/hono';

export const loyaltyRoutes = new Hono<AppBindings>();

loyaltyRoutes.use('*', authMiddleware);

// GET /loyalty/rewards — katalog reward aktif (POS). ?all=true untuk owner.
loyaltyRoutes.get('/rewards', validate('query', listRewardQuerySchema), listRewardsHandler);

// POST /loyalty/redeem — tukar poin member dengan reward (kasir).
loyaltyRoutes.post('/redeem', validate('json', redeemSchema), redeemHandler);

// Kelola katalog reward — owner/admin.
loyaltyRoutes.post(
  '/rewards',
  requireRole('admin', 'owner'),
  validate('json', createRewardSchema),
  createRewardHandler,
);
loyaltyRoutes.patch(
  '/rewards/:id',
  requireRole('admin', 'owner'),
  validate('param', rewardIdParamSchema),
  validate('json', updateRewardSchema),
  updateRewardHandler,
);
loyaltyRoutes.delete(
  '/rewards/:id',
  requireRole('admin', 'owner'),
  validate('param', rewardIdParamSchema),
  deleteRewardHandler,
);
