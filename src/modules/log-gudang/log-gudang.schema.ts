import { z } from 'zod';

// jenis dibiarkan string bebas (FE menentukan, mis. UPDATE_Stok, DELETE_ITEM).
export const createLogGudangSchema = z.object({
  jenis: z.string().trim().min(1).max(40),
  logs: z.string().trim().min(1).max(2000),
});

export const listLogGudangQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  jenis: z.string().trim().max(40).optional(),
});

export type CreateLogGudangInput = z.infer<typeof createLogGudangSchema>;
export type ListLogGudangQuery = z.infer<typeof listLogGudangQuerySchema>;
