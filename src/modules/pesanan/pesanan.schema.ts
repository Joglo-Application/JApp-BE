import { z } from 'zod';

export const pesananItemSchema = z.object({
  menuId: z.number().int().positive(),
  jumlah: z.number().int().positive(),
});

export const createPesananSchema = z.object({
  items: z.array(pesananItemSchema).min(1, 'Pesanan harus memiliki minimal satu item'),
});

export const pesananIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPesananQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
});

export type PesananItemInput = z.infer<typeof pesananItemSchema>;
export type CreatePesananInput = z.infer<typeof createPesananSchema>;
export type ListPesananQuery = z.infer<typeof listPesananQuerySchema>;
