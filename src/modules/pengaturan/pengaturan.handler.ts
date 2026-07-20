import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './pengaturan.service';
import type { AppBindings } from '@/types/hono';
import type { GrupPengaturan } from './pengaturan.schema';

export const getSemuaHandler: Handler<AppBindings> = async (c) => {
  return c.json(success(await service.getSemua()));
};

export const getGrupHandler: Handler<AppBindings> = async (c) => {
  const grup = c.req.param('grup') as GrupPengaturan;
  return c.json(success(await service.getGrup(grup)));
};

export const simpanGrupHandler: Handler<AppBindings> = async (c) => {
  const grup = c.req.param('grup') as GrupPengaturan;
  const body = await c.req.json().catch(() => ({}));
  return c.json(success(await service.simpanGrup(grup, body)));
};
