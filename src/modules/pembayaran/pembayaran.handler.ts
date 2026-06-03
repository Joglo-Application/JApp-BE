import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import * as service from './pembayaran.service';
import type { CreatePembayaranInput } from './pembayaran.schema';
import type { AppBindings } from '@/types/hono';

export const listPembayaranHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listPembayaran({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    metode: q.metode as 'cash' | 'qris' | 'debit' | 'transfer' | undefined,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getPembayaranHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getPembayaranById(id);
  return c.json(success(data));
};

export const createPembayaranHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreatePembayaranInput;
  const data = await service.createPembayaran(input);
  return c.json(success(data), 201);
};
