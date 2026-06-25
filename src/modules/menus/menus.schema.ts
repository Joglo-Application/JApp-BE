import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && parseFloat(v) > 0, {
    message: 'Harus angka positif (maksimal 3 desimal)',
  });

export const createMenuSchema = z.object({
  namaMenu: z.string().trim().min(1).max(100),
  kategori: z.string().trim().min(1).max(50),
  harga: z.number().int().min(0),
  isActive: z.boolean().default(true),
  // Stok produk untuk tampilan inventori POS.
  stok: z.number().int().min(0).default(0),
  stokMinimum: z.number().int().min(0).default(0),
  imageUrl: z.string().trim().max(255).optional(),
  // Resep makanan opsional — dibuat sekaligus dalam satu transaksi.
  resep: z
    .array(
      z.object({
        bahanId: z.number().int().positive(),
        jumlahPakai: decimalString,
      }),
    )
    .optional(),
});

export const updateMenuSchema = z
  .object({
    namaMenu: z.string().trim().min(1).max(100).optional(),
    kategori: z.string().trim().min(1).max(50).optional(),
    harga: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    stok: z.number().int().min(0).optional(),
    stokMinimum: z.number().int().min(0).optional(),
    imageUrl: z.string().trim().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const menuIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createResepSchema = z.object({
  bahanId: z.number().int().positive(),
  jumlahPakai: decimalString,
});

export const updateResepSchema = z.object({
  jumlahPakai: decimalString,
});

export const resepIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  resepId: z.coerce.number().int().positive(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type CreateResepInput = z.infer<typeof createResepSchema>;
export type UpdateResepInput = z.infer<typeof updateResepSchema>;
