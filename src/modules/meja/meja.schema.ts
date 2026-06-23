import { z } from 'zod';

const statusEnum = z.enum(['available', 'occupied', 'reserved', 'blocked']);

export const createMejaSchema = z.object({
  nomor: z.string().trim().min(1).max(30),
  zona: z.string().trim().max(50).optional(),
  kapasitas: z.number().int().min(1).max(100).default(4),
  status: statusEnum.default('available'),
});

export const updateMejaSchema = z
  .object({
    nomor: z.string().trim().min(1).max(30).optional(),
    zona: z.string().trim().max(50).optional(),
    kapasitas: z.number().int().min(1).max(100).optional(),
    status: statusEnum.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Minimal satu field harus diisi' });

export const updateMejaStatusSchema = z.object({ status: statusEnum });

export const mejaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listMejaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  zona: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
});

export type CreateMejaInput = z.infer<typeof createMejaSchema>;
export type UpdateMejaInput = z.infer<typeof updateMejaSchema>;
export type ListMejaQuery = z.infer<typeof listMejaQuerySchema>;
