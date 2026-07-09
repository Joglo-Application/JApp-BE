import { z } from 'zod';

export const listAbsensiQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
});

export type ListAbsensiQuery = z.infer<typeof listAbsensiQuerySchema>;
