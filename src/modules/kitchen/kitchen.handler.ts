import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './kitchen.service';
import type { AppBindings } from '@/types/hono';

export const listKitchenOrdersHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listActiveOrders();
  return c.json(success(data));
};
