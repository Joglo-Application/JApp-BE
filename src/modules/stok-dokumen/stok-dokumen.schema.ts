import { z } from 'zod';

const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const rentangQuerySchema = z.object({
  start: tanggalSchema.optional(),
  end: tanggalSchema.optional(),
  status: z.enum(['draft', 'posted', 'cancelled']).optional(),
});

export const createOpnameSchema = z.object({
  catatan: z.string().trim().max(500).optional(),
  /** true = langsung diposting sehingga stok bahan ikut disesuaikan. */
  langsungPosting: z.boolean().default(false),
  items: z
    .array(
      z.object({
        bahanId: z.number().int().positive(),
        /** Hasil hitung fisik di gudang. */
        stokFisik: z.number().min(0),
      }),
    )
    .min(1, 'Dokumen harus memiliki minimal satu item'),
});

export const createProduksiSchema = z.object({
  catatan: z.string().trim().max(500).optional(),
  langsungPosting: z.boolean().default(false),
  items: z
    .array(
      z.object({
        menuId: z.number().int().positive(),
        jumlah: z.number().int().positive(),
      }),
    )
    .min(1, 'Dokumen harus memiliki minimal satu item'),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type RentangQuery = z.infer<typeof rentangQuerySchema>;
export type CreateOpnameInput = z.infer<typeof createOpnameSchema>;
export type CreateProduksiInput = z.infer<typeof createProduksiSchema>;
