import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import * as service from './meja.service';
import type { CreateMejaInput, UpdateMejaInput } from './meja.schema';
import type { AppBindings } from '@/types/hono';

export const listMejaHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listMeja({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 50),
    zona: q.zona,
    status: q.status as
      | 'available'
      | 'occupied'
      | 'reserved'
      | 'blocked'
      | undefined,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getMejaHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  return c.json(success(await service.getMejaById(id)));
};

export const createMejaHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateMejaInput;
  return c.json(success(await service.createMeja(input)), 201);
};

export const updateMejaHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdateMejaInput;
  return c.json(success(await service.updateMeja(id, input)));
};

export const updateMejaStatusHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const { status } = (await c.req.json()) as {
    status: 'available' | 'occupied' | 'reserved' | 'blocked';
  };
  return c.json(success(await service.updateMejaStatus(id, status)));
};

export const deleteMejaHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deleteMeja(id);
  return c.json(success({ deleted: true }));
};
