import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { BadRequestError } from '@/shared/errors';
import * as service from './kitchen.service';
import type { AppBindings } from '@/types/hono';

export const listKitchenOrdersHandler: Handler<AppBindings> = async (c) => {
  const status = c.req.query('status') as
    | 'in_progress'
    | 'completed'
    | 'all'
    | undefined;
  const data = await service.listActiveOrders(c.req.query('date'), status);
  return c.json(success(data));
};

export const setKitchenItemDoneHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const detailId = Number(c.req.param('detailId'));
  const body = (await c.req.json().catch(() => ({}))) as { selesai?: boolean };
  const data = await service.setItemDone(id, detailId, body.selesai ?? true);
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
