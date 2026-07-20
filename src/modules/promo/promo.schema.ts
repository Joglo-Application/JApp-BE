import { z } from 'zod';

const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const promoTipeSchema = z.enum(['amount', 'percent']);

export const createPromoSchema = z
  .object({
    kode: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, 'Kode hanya boleh huruf, angka, underscore, dan strip'),
    nama: z.string().trim().min(1).max(100),
    tipe: promoTipeSchema,
    nilai: z.number().positive('Nilai promo harus lebih dari 0'),
    minBelanja: z.number().int().min(0).default(0),
    maxDiskon: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
    mulai: tanggalSchema.optional(),
    berakhir: tanggalSchema.optional(),
  })
  .refine((d) => d.tipe !== 'percent' || d.nilai <= 100, {
    message: 'Promo persen tidak boleh lebih dari 100',
    path: ['nilai'],
  })
  .refine((d) => !d.mulai || !d.berakhir || d.mulai <= d.berakhir, {
    message: 'Tanggal mulai tidak boleh setelah tanggal berakhir',
    path: ['berakhir'],
  });

export const updatePromoSchema = z
  .object({
    kode: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    nama: z.string().trim().min(1).max(100).optional(),
    tipe: promoTipeSchema.optional(),
    nilai: z.number().positive().optional(),
    minBelanja: z.number().int().min(0).optional(),
    maxDiskon: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    mulai: tanggalSchema.nullable().optional(),
    berakhir: tanggalSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const promoIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPromoQuerySchema = z.object({
  /** `true` = tampilkan juga promo nonaktif/kedaluwarsa (untuk layar owner). */
  all: z.enum(['true', 'false']).optional(),
});

/** Validasi kode promo terhadap subtotal keranjang. */
export const validatePromoSchema = z.object({
  kode: z.string().trim().min(1).max(30),
  subtotal: z.number().int().min(0),
});

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
export type ValidatePromoInput = z.infer<typeof validatePromoSchema>;
