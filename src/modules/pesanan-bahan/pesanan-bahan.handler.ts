import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './pesanan-bahan.service';
import type {
  CreatePesananBahanInput,
  ReceivePesananBahanInput,
} from './pesanan-bahan.schema';
import type { AppBindings } from '@/types/hono';

export const listPesananBahanHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listPesananBahan({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    status: q.status as 'pending' | 'received' | 'cancelled' | undefined,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getPesananBahanHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getPesananBahanById(id);
  return c.json(success(data));
};

export const createPesananBahanHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as CreatePesananBahanInput;
  const data = await service.createPesananBahan(user.userId, input);
  return c.json(success(data), 201);
};

export const receivePesananBahanHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as ReceivePesananBahanInput;
  const data = await service.receivePesananBahan(user.userId, id, input);
  return c.json(success(data));
};

export const cancelPesananBahanHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.cancelPesananBahan(id);
  return c.json(success(data));
};
