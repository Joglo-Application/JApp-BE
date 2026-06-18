import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './transaksi.service';
import type { AppBindings } from '@/types/hono';

export const listTransaksiHandler: Handler<AppBindings> = async (c) => {
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10);
  const data = await service.listTransaksi(date);
  return c.json(success(data));
};
