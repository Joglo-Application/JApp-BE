import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './transaksi-keluar.service';
import type { CreateTransaksiKeluarInput } from './transaksi-keluar.schema';
import type { AppBindings } from '@/types/hono';

export const listTransaksiKeluarHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listTransaksiKeluar({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    bahanId: q.bahanId ? Number(q.bahanId) : undefined,
    tipeKeluar: q.tipeKeluar as
      | 'sale'
      | 'waste'
      | 'damaged'
      | 'expired'
      | 'adjustment'
      | undefined,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getTransaksiKeluarHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getTransaksiKeluarById(id);
  return c.json(success(data));
};

export const createTransaksiKeluarHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as CreateTransaksiKeluarInput;
  const data = await service.createTransaksiKeluar(user.userId, input);
  return c.json(success(data), 201);
};
