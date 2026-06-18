import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './stok-gudang.service';
import type { AppBindings } from '@/types/hono';

export const listStokGudangHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listStokGudang();
  return c.json(success(data));
};
