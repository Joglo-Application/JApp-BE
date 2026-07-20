import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './loyalty.service';
import type { AppBindings } from '@/types/hono';
import type { CreateRewardInput, RedeemInput, UpdateRewardInput } from './loyalty.schema';

export const listRewardsHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listRewards(c.req.query('all') === 'true');
  return c.json(success(data));
};

export const createRewardHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateRewardInput;
  const data = await service.createReward(input);
  return c.json(success(data), 201);
};

export const updateRewardHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdateRewardInput;
  const data = await service.updateReward(id, input);
  return c.json(success(data));
};

export const deleteRewardHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deleteReward(id);
  return c.json(success({ message: 'Reward dihapus' }));
};

export const redeemHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as RedeemInput;
  const data = await service.redeemReward(input);
  return c.json(success(data));
};
