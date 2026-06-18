import { z } from 'zod';

export const transaksiQuerySchema = z.object({
  // Tanggal tunggal (YYYY-MM-DD). Default: hari ini bila tidak dikirim.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
});

export type TransaksiQuery = z.infer<typeof transaksiQuerySchema>;
