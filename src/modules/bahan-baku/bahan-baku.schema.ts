import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v), {
    message: 'Harus angka non-negatif dengan maksimal 3 desimal',
  });

export const createBahanBakuSchema = z.object({
  namaBahan: z.string().trim().min(1).max(100),
  satuan: z.string().trim().min(1).max(20),
  stok: decimalString.default('0'),
  stokMinimum: decimalString.default('0'),
  hargaSatuan: z.number().int().min(0).default(0),
  // Untuk tampilan stok gudang owner.
  kategori: z.string().trim().max(50).optional(),
  imageUrl: z.string().trim().max(255).optional(),
});

export const updateBahanBakuSchema = z
  .object({
    namaBahan: z.string().trim().min(1).max(100).optional(),
    satuan: z.string().trim().min(1).max(20).optional(),
    stok: decimalString.optional(),
    stokMinimum: decimalString.optional(),
    hargaSatuan: z.number().int().min(0).optional(),
    kategori: z.string().trim().max(50).nullable().optional(),
    imageUrl: z.string().trim().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const bahanIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Tambah stok (positif, maks 3 desimal). Tolak 0/negatif.
export const tambahStokSchema = z.object({
  jumlah: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && Number(v) > 0, {
      message: 'Jumlah harus angka positif dengan maksimal 3 desimal',
    }),
});

export type CreateBahanBakuInput = z.infer<typeof createBahanBakuSchema>;
export type UpdateBahanBakuInput = z.infer<typeof updateBahanBakuSchema>;
export type TambahStokInput = z.infer<typeof tambahStokSchema>;
