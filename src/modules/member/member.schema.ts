import { z } from 'zod';

const profilFields = {
  gender: z.string().trim().max(20).optional(),
  tanggalLahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  alamat: z.string().trim().max(500).optional(),
  catatan: z.string().trim().max(500).optional(),
};

export const createMemberSchema = z.object({
  nama: z.string().trim().min(1).max(100),
  noTelp: z.string().trim().min(5).max(20).optional(),
  email: z.string().trim().email().max(100).optional(),
  ...profilFields,
});

export const updateMemberSchema = z
  .object({
    nama: z.string().trim().min(1).max(100).optional(),
    noTelp: z.string().trim().min(5).max(20).optional(),
    email: z.string().trim().email().max(100).optional(),
    ...profilFields,
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Minimal satu field harus diisi' });

export const adjustPoinSchema = z.object({
  tipe: z.enum(['earn', 'redeem', 'adjustment']),
  poin: z.number().int().positive(),
  pesananId: z.number().int().positive().optional(),
});

export const memberIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listMemberQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().min(1).optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AdjustPoinInput = z.infer<typeof adjustPoinSchema>;
export type ListMemberQuery = z.infer<typeof listMemberQuerySchema>;
