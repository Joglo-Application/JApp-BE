import { z } from 'zod';

export const kategoriJenisSchema = z.enum(['menu', 'stok', 'stok_gudang']);

export const createAreaSchema = z.object({
  nama: z.string().trim().min(1).max(60),
  urutan: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateAreaSchema = z
  .object({
    nama: z.string().trim().min(1).max(60).optional(),
    urutan: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Minimal satu field harus diisi' });

export const createKategoriSchema = z.object({
  jenis: kategoriJenisSchema,
  nama: z.string().trim().min(1).max(60),
  urutan: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateKategoriSchema = z
  .object({
    nama: z.string().trim().min(1).max(60).optional(),
    urutan: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Minimal satu field harus diisi' });

export const listKategoriQuerySchema = z.object({
  jenis: kategoriJenisSchema.optional(),
});

export const createMetodeSchema = z.object({
  nama: z.string().trim().min(1).max(60),
  kode: z.enum(['cash', 'qris', 'debit', 'transfer', 'qris_netzme']),
  urutan: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateMetodeSchema = z
  .object({
    nama: z.string().trim().min(1).max(60).optional(),
    kode: z.enum(['cash', 'qris', 'debit', 'transfer', 'qris_netzme']).optional(),
    urutan: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Minimal satu field harus diisi' });

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
export type CreateKategoriInput = z.infer<typeof createKategoriSchema>;
export type UpdateKategoriInput = z.infer<typeof updateKategoriSchema>;
export type CreateMetodeInput = z.infer<typeof createMetodeSchema>;
export type UpdateMetodeInput = z.infer<typeof updateMetodeSchema>;
