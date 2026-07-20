import type { Handler } from 'hono';
import { success } from '@/shared/response';
import * as service from './laporan.service';
import type { AppBindings } from '@/types/hono';
import type { RentangQuery } from './laporan.schema';

function rentang(c: Parameters<Handler<AppBindings>>[0]): RentangQuery {
  const q = c.req.query();
  return { start: q.start, end: q.end };
}

export const ringkasanHandler: Handler<AppBindings> = async (c) => {
  return c.json(success(await service.ringkasan(rentang(c))));
};

export const produkHandler: Handler<AppBindings> = async (c) => {
  return c.json(success(await service.produk(rentang(c))));
};

export const pembayaranHandler: Handler<AppBindings> = async (c) => {
  return c.json(success(await service.perPembayaran(rentang(c))));
};

export const guestHandler: Handler<AppBindings> = async (c) => {
  return c.json(success(await service.guest(rentang(c))));
};

export const dashboardHandler: Handler<AppBindings> = async (c) => {
  return c.json(success(await service.dashboard(rentang(c))));
};

export const exportHandler: Handler<AppBindings> = async (c) => {
  const jenis = c.req.query('jenis') ?? 'ringkasan';
  const { filename, csv } = await service.exportLaporan(jenis, rentang(c));
  // Diawali BOM agar Excel membaca UTF-8 dengan benar.
  return c.body(`\uFEFF${csv}`, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
};
