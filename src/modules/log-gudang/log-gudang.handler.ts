import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './log-gudang.service';
import type { CreateLogGudangInput } from './log-gudang.schema';
import type { AppBindings } from '@/types/hono';

export const createLogGudangHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as CreateLogGudangInput;
  const data = await service.createLog(user.userId, input);
  return c.json(success(data), 201);
};

export const listLogGudangHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const data = await service.listLog({ date: q.date, jenis: q.jenis });
  return c.json(success(data));
};
