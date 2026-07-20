import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as service from './transaksi.service';
import type { AppBindings } from '@/types/hono';
import type { ReturTransaksiInput } from './transaksi.schema';

export const listTransaksiHandler: Handler<AppBindings> = async (c) => {
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10);
  const data = await service.listTransaksi(date);
  return c.json(success(data));
};

export const returTransaksiHandler: Handler<AppBindings> = async (c) => {
  const user = c.get('user');
  if (!user) throw new UnauthorizedError();
  // Menerima "TRX-0001" maupun "1" — keduanya menunjuk pesananId yang sama.
  const pesananId = Number((c.req.param('kode') ?? '').replace(/^TRX-/i, ''));
  const input = (await c.req.json()) as ReturTransaksiInput;
  const data = await service.returTransaksi(user.userId, pesananId, input);
  return c.json(success(data));
};
