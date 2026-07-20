import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './pesanan.service';
import type { CreatePesananInput, PindahMejaInput } from './pesanan.schema';
import type { AppBindings } from '@/types/hono';

export const listPesananHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listPesanan({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    status: q.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | undefined,
    mejaId: q.mejaId ? Number(q.mejaId) : undefined,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getPesananHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getPesananById(id);
  return c.json(success(data));
};

export const getStrukHandler: Handler<AppBindings> = async (c) => {
  const data = await service.getStruk(Number(c.req.param('id')));
  return c.json(success(data));
};

export const createPesananHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as CreatePesananInput;
  const data = await service.createPesanan(user.userId, input);
  return c.json(success(data), 201);
};

export const cancelPesananHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const id = Number(c.req.param('id'));
  const data = await service.cancelPesanan(user.userId, id);
  return c.json(success(data));
};

export const deletePesananHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deletePesanan(id);
  return c.json(success({ deleted: true }));
};

export const pindahMejaHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as PindahMejaInput;
  const data = await service.pindahMeja(id, input.mejaId);
  return c.json(success(data));
};
