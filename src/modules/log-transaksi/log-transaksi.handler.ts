import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './log-transaksi.service';
import type { CreateLogInput, ListLogQuery } from './log-transaksi.schema';
import type { AppBindings } from '@/types/hono';

export const createLogHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError('Tidak terautentikasi');
  const input = (await c.req.json()) as CreateLogInput;
  const data = await service.createLog(user.userId, input);
  return c.json(success(data), 201);
};

export const listLogHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const data = await service.listLog({
    date: q.date,
    tipe: q.tipe as ListLogQuery['tipe'],
  });
  return c.json(success(data));
};
