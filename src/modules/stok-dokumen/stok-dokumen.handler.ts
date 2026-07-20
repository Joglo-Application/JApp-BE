import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './stok-dokumen.service';
import type { AppBindings } from '@/types/hono';
import type { CreateOpnameInput, CreateProduksiInput } from './stok-dokumen.schema';

function rentang(c: Parameters<Handler<AppBindings>>[0]) {
  const q = c.req.query();
  return { start: q.start, end: q.end, status: q.status as never };
}

const idParam = (c: Parameters<Handler<AppBindings>>[0]) => Number(c.req.param('id'));

function userId(c: Parameters<Handler<AppBindings>>[0]) {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  return user.userId;
}

export const listOpnameHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.listOpname(rentang(c))));

export const createOpnameHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateOpnameInput;
  return c.json(success(await service.createOpname(userId(c), input)), 201);
};

export const postingOpnameHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.postingOpname(idParam(c))));

export const batalOpnameHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.batalOpname(idParam(c))));

export const listProduksiHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.listProduksi(rentang(c))));

export const createProduksiHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateProduksiInput;
  return c.json(success(await service.createProduksi(userId(c), input)), 201);
};

export const postingProduksiHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.postingProduksi(idParam(c))));

export const batalProduksiHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.batalProduksi(idParam(c))));
