import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && parseFloat(v) > 0, {
    message: 'Harus angka positif (maksimal 3 desimal)',
  });

export const createPesananBahanSchema = z.object({
  bahanId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  jumlah: decimalString,
});

export const receivePesananBahanSchema = z.object({
  hargaSatuan: z.number().int().min(0),
  jumlah: decimalString.optional(),
});

export const pesananBahanIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPesananBahanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['pending', 'received', 'cancelled']).optional(),
});

export type CreatePesananBahanInput = z.infer<typeof createPesananBahanSchema>;
export type ReceivePesananBahanInput = z.infer<typeof receivePesananBahanSchema>;
export type ListPesananBahanQuery = z.infer<typeof listPesananBahanQuerySchema>;
