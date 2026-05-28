import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import * as service from './menus.service';
import type {
  CreateMenuInput,
  CreateResepInput,
  UpdateMenuInput,
  UpdateResepInput,
} from './menus.schema';
import type { AppBindings } from '@/types/hono';

export const listMenusHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listMenus({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    q: q.q,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getMenuHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const data = await service.getMenuById(id);
  return c.json(success(data));
};

export const createMenuHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateMenuInput;
  const data = await service.createMenu(input);
  return c.json(success(data), 201);
};

export const updateMenuHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdateMenuInput;
  const data = await service.updateMenu(id, input);
  return c.json(success(data));
};

export const deleteMenuHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deleteMenu(id);
  return c.json(success({ deleted: true }));
};

// Resep sub-resource

export const listResepHandler: Handler<AppBindings> = async (c) => {
  const menuId = Number(c.req.param('id'));
  const data = await service.listResep(menuId);
  return c.json(success(data));
};

export const addResepHandler: Handler<AppBindings> = async (c) => {
  const menuId = Number(c.req.param('id'));
  const input = (await c.req.json()) as CreateResepInput;
  const data = await service.addResep(menuId, input);
  return c.json(success(data), 201);
};

export const updateResepHandler: Handler<AppBindings> = async (c) => {
  const menuId = Number(c.req.param('id'));
  const resepId = Number(c.req.param('resepId'));
  const input = (await c.req.json()) as UpdateResepInput;
  const data = await service.updateResep(menuId, resepId, input);
  return c.json(success(data));
};

export const deleteResepHandler: Handler<AppBindings> = async (c) => {
  const menuId = Number(c.req.param('id'));
  const resepId = Number(c.req.param('resepId'));
  await service.deleteResep(menuId, resepId);
  return c.json(success({ deleted: true }));
};
