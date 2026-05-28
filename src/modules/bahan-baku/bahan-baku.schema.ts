import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v), {
    message: 'Harus angka non-negatif dengan maksimal 3 desimal',
  });

export const createBahanBakuSchema = z.object({
  namaBahan: z.string().trim().min(1).max(100),
  satuan: z.string().trim().min(1).max(20),
  stok: decimalString.default('0'),
  stokMinimum: decimalString.default('0'),
  hargaSatuan: z.number().int().min(0).default(0),
});

export const updateBahanBakuSchema = z
  .object({
    namaBahan: z.string().trim().min(1).max(100).optional(),
    satuan: z.string().trim().min(1).max(20).optional(),
    stok: decimalString.optional(),
    stokMinimum: decimalString.optional(),
    hargaSatuan: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const bahanIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateBahanBakuInput = z.infer<typeof createBahanBakuSchema>;
export type UpdateBahanBakuInput = z.infer<typeof updateBahanBakuSchema>;
