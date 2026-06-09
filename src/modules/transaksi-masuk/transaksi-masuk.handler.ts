import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './transaksi-masuk.service';
import type { CreateTransaksiMasukInput } from './transaksi-masuk.schema';
import type { AppBindings } from '@/types/hono';

export const listTransaksiMasukHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listTransaksiMasuk({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    bahanId: q.bahanId ? Number(q.bahanId) : undefined,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getTransaksiMasukHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getTransaksiMasukById(id);
  return c.json(success(data));
};

export const createTransaksiMasukHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as CreateTransaksiMasukInput;
  const data = await service.createTransaksiMasuk(user.userId, input);
  return c.json(success(data), 201);
};
