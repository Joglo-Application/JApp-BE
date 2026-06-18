import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './inventori.service';
import type { AppBindings } from '@/types/hono';

export const listInventoriHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listInventori();
  return c.json(success(data));
};
