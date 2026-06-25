import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { BadRequestError } from '@/shared/errors';
import * as service from './kitchen.service';
import type { AppBindings } from '@/types/hono';

export const listKitchenOrdersHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listActiveOrders();
  return c.json(success(data));
};

export const completeKitchenOrderHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError('ID pesanan tidak valid');
  }
  await service.completeOrder(id);
  return c.json(success({ id, status: 'completed' }));
};
