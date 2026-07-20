import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './promo.service';
import type { AppBindings } from '@/types/hono';
import type { CreatePromoInput, UpdatePromoInput, ValidatePromoInput } from './promo.schema';

export const listHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listPromo(c.req.query('all') === 'true');
  return c.json(success(data));
};

export const validateHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as ValidatePromoInput;
  const data = await service.validatePromo(input);
  return c.json(success(data));
};

export const createHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreatePromoInput;
  const data = await service.createPromo(input);
  return c.json(success(data), 201);
};

export const updateHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdatePromoInput;
  const data = await service.updatePromo(id, input);
  return c.json(success(data));
};

export const deleteHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deletePromo(id);
  return c.json(success({ message: 'Promo dihapus' }));
};
