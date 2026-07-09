import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { BadRequestError, UnauthorizedError } from '@/shared/errors';
import * as service from './shift-kas.service';
import type { CreateEntryInput, StartShiftInput, UpdateEntryInput } from './shift-kas.schema';
import type { AppBindings } from '@/types/hono';

function paramId(c: Parameters<Handler<AppBindings>>[0]): number {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID tidak valid');
  return id;
}

export const getActiveShiftHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const data = await service.getActiveShift(user.userId);
  return c.json(success(data));
};

export const startShiftHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as StartShiftInput;
  const data = await service.startShift(user.userId, input.kasAwal ?? 0);
  return c.json(success(data), 201);
};

export const addEntryHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as CreateEntryInput;
  const data = await service.addEntry(user.userId, paramId(c), input);
  return c.json(success(data), 201);
};

export const updateEntryHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const input = (await c.req.json()) as UpdateEntryInput;
  const data = await service.updateEntry(user.userId, paramId(c), input);
  return c.json(success(data));
};

export const deleteEntryHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const data = await service.deleteEntry(user.userId, paramId(c));
  return c.json(success(data));
};

export const closeShiftHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const data = await service.closeShift(user.userId, paramId(c));
  return c.json(success(data));
};

export const getShiftHandler: Handler<AppBindings> = async (c) => {
  const data = await service.getShiftById(paramId(c));
  return c.json(success(data));
};

export const listShiftHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const q = c.req.query();
  // Kasir hanya lihat shift miliknya; admin/owner/supervisor lihat semua.
  const seeAll = user.role === 'admin' || user.role === 'owner' || user.role === 'supervisor';
  const data = await service.listShifts(
    { date: q.date },
    { userId: seeAll ? undefined : user.userId },
  );
  return c.json(success(data));
};
