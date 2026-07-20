import { z } from 'zod';

const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const rentangQuerySchema = z.object({
  start: tanggalSchema.optional(),
  end: tanggalSchema.optional(),
});

export const createOpnameSchema = z.object({
  bahanId: z.number().int().positive(),
  /** Hasil hitung fisik di gudang. Selisih terhadap stok sistem dicatat. */
  stokFisik: z.number().min(0),
  catatan: z.string().trim().max(500).optional(),
});

export const createProduksiSchema = z.object({
  menuId: z.number().int().positive(),
  jumlah: z.number().int().positive(),
  catatan: z.string().trim().max(500).optional(),
});

export type RentangQuery = z.infer<typeof rentangQuerySchema>;
export type CreateOpnameInput = z.infer<typeof createOpnameSchema>;
export type CreateProduksiInput = z.infer<typeof createProduksiSchema>;
