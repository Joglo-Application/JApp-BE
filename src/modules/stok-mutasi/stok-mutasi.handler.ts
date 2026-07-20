import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './stok-mutasi.service';
import type { AppBindings } from '@/types/hono';
import type { CreateStokKeluarInput, CreateStokMasukInput } from './stok-mutasi.schema';

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

export const listMasukHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.listStokMasuk(rentang(c))));

export const createMasukHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateStokMasukInput;
  return c.json(success(await service.createStokMasuk(userId(c), input)), 201);
};

export const postingMasukHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.postingStokMasuk(idParam(c))));

export const batalMasukHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.batalStokMasuk(idParam(c))));

export const listKeluarHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.listStokKeluar(rentang(c))));

export const createKeluarHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateStokKeluarInput;
  return c.json(success(await service.createStokKeluar(userId(c), input)), 201);
};

export const postingKeluarHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.postingStokKeluar(idParam(c))));

export const batalKeluarHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.batalStokKeluar(idParam(c))));
