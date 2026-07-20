import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './master.service';
import type { AppBindings } from '@/types/hono';
import type {
  CreateAreaInput,
  CreateKategoriInput,
  CreateMetodeInput,
  UpdateAreaInput,
  UpdateKategoriInput,
  UpdateMetodeInput,
} from './master.schema';

const id = (c: Parameters<Handler<AppBindings>>[0]) => Number(c.req.param('id'));

export const listAreaHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.listArea()));

export const createAreaHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.createArea((await c.req.json()) as CreateAreaInput)), 201);

export const updateAreaHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.updateArea(id(c), (await c.req.json()) as UpdateAreaInput)));

export const deleteAreaHandler: Handler<AppBindings> = async (c) => {
  await service.deleteArea(id(c));
  return c.json(success({ message: 'Area dihapus' }));
};

export const listKategoriHandler: Handler<AppBindings> = async (c) =>
  c.json(
    success(
      await service.listKategori(
        c.req.query('jenis') as 'menu' | 'stok' | 'stok_gudang' | undefined,
      ),
    ),
  );

export const createKategoriHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.createKategori((await c.req.json()) as CreateKategoriInput)), 201);

export const updateKategoriHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.updateKategori(id(c), (await c.req.json()) as UpdateKategoriInput)));

export const deleteKategoriHandler: Handler<AppBindings> = async (c) => {
  await service.deleteKategori(id(c));
  return c.json(success({ message: 'Kategori dihapus' }));
};

export const listMetodeHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.listMetode()));

export const createMetodeHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.createMetode((await c.req.json()) as CreateMetodeInput)), 201);

export const updateMetodeHandler: Handler<AppBindings> = async (c) =>
  c.json(success(await service.updateMetode(id(c), (await c.req.json()) as UpdateMetodeInput)));

export const deleteMetodeHandler: Handler<AppBindings> = async (c) => {
  await service.deleteMetode(id(c));
  return c.json(success({ message: 'Metode pembayaran dihapus' }));
};
