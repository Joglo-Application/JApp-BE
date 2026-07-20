import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './absensi.service';
import type { AppBindings } from '@/types/hono';

export const checkInHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const data = await service.checkIn(user.userId);
  return c.json(success(data), 201);
};

export const checkOutHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const data = await service.checkOut(user.userId);
  return c.json(success(data));
};

export const absensiSayaHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  const data = await service.getAbsensiSaya(user.userId);
  return c.json(success(data));
};

export const exportAbsensiHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const { filename, csv } = await service.exportAbsensi({ start: q.start, end: q.end });
  // Diawali BOM agar Excel membaca UTF-8 dengan benar.
  return c.body(`\uFEFF${csv}`, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
};

export const listAbsensiHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const data = await service.listAbsensi({ date: q.date });
  return c.json(success(data));
};
