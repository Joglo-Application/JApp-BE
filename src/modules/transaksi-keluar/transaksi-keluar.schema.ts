import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && parseFloat(v) > 0, {
    message: 'Harus angka positif (maksimal 3 desimal)',
  });

// Tipe keluar untuk input manual — `sale` dikecualikan karena hanya dihasilkan
// otomatis oleh modul pesanan (penjualan).
const tipeKeluarManual = z.enum(['waste', 'damaged', 'expired', 'adjustment']);

export const createTransaksiKeluarSchema = z.object({
  bahanId: z.number().int().positive(),
  jumlah: decimalString,
  tipeKeluar: tipeKeluarManual,
  keterangan: z.string().trim().max(500).optional(),
});

export const transaksiKeluarIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTransaksiKeluarQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  bahanId: z.coerce.number().int().positive().optional(),
  tipeKeluar: z
    .enum(['sale', 'waste', 'damaged', 'expired', 'adjustment'])
    .optional(),
});

export type CreateTransaksiKeluarInput = z.infer<typeof createTransaksiKeluarSchema>;
export type ListTransaksiKeluarQuery = z.infer<typeof listTransaksiKeluarQuerySchema>;
