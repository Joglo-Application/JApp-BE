import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import * as service from './suppliers.service';
import type { CreateSupplierInput, UpdateSupplierInput } from './suppliers.schema';
import type { AppBindings } from '@/types/hono';

export const listHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listSuppliers({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    q: q.q,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getSupplierById(id);
  return c.json(success(data));
};

export const createHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateSupplierInput;
  const data = await service.createSupplier(input);
  return c.json(success(data), 201);
};

export const updateHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdateSupplierInput;
  const data = await service.updateSupplier(id, input);
  return c.json(success(data));
};

export const deleteHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deleteSupplier(id);
  return c.json(success({ deleted: true }));
};
