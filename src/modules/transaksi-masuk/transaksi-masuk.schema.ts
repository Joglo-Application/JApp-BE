import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && parseFloat(v) > 0, {
    message: 'Harus angka positif (maksimal 3 desimal)',
  });

export const createTransaksiMasukSchema = z.object({
  bahanId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  jumlah: decimalString,
  hargaSatuan: z.number().int().min(0),
});

export const transaksiMasukIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTransaksiMasukQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  bahanId: z.coerce.number().int().positive().optional(),
});

export type CreateTransaksiMasukInput = z.infer<typeof createTransaksiMasukSchema>;
export type ListTransaksiMasukQuery = z.infer<typeof listTransaksiMasukQuerySchema>;
