import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { verifyPin } from '../auth/auth.service';
import * as service from './pengaturan.service';
import type { AppBindings } from '@/types/hono';
import type { GrupPengaturan, UbahPajakCepatInput } from './pengaturan.schema';

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

/**
 * Ubah cepat tarif (Pajak / Biaya Layanan) dari POS. Disetujui PIN supervisor
 * (bukan role owner/admin), lalu disimpan ke grup 'pajak' sebagai default toko.
 */
export const ubahPajakCepatHandler: Handler<AppBindings> = async (c) => {
  const { target, tipe, nilai, pin } = c.req.valid('json' as never) as UbahPajakCepatInput;
  await verifyPin({ pin });
  const patch =
    target === 'layanan'
      ? tipe === 'amount'
        ? { biayaLayananAktif: true, biayaLayananTipe: 'amount' as const, biayaLayananNominal: nilai }
        : { biayaLayananAktif: true, biayaLayananTipe: 'percent' as const, biayaLayananPersen: nilai }
      : tipe === 'amount'
        ? { pajakAktif: true, pajakTipe: 'amount' as const, pajakNominal: nilai }
        : { pajakAktif: true, pajakTipe: 'percent' as const, pajakPersen: nilai };
  return c.json(success(await service.simpanGrup('pajak', patch)));
};
