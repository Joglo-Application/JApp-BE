import { z } from 'zod';

export const createPembayaranSchema = z.object({
  pesananId: z.number().int().positive(),
  metode: z.enum(['cash', 'qris', 'debit', 'transfer']),
  jumlahBayar: z.number().int().min(0),
});

export const pembayaranIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPembayaranQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  metode: z.enum(['cash', 'qris', 'debit', 'transfer']).optional(),
});

export type CreatePembayaranInput = z.infer<typeof createPembayaranSchema>;
export type ListPembayaranQuery = z.infer<typeof listPembayaranQuerySchema>;
