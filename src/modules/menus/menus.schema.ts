import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && parseFloat(v) > 0, {
    message: 'Harus angka positif (maksimal 3 desimal)',
  });

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

// Kategori disimpan case-insensitive: selalu di-normalisasi ke huruf kecil +
// trim, jadi "Makanan"/"makanan"/"MAKANAN" dianggap satu nilai yang sama.
const kategoriString = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((v) => v.toLowerCase());

export const createMenuSchema = z
  .object({
    namaMenu: z.string().trim().min(1).max(100),
    kategori: kategoriString,
    harga: z.number().int().min(0),
    isActive: z.boolean().default(true),
    // Stok produk untuk tampilan inventori POS.
    stok: z.number().int().min(0).default(0),
    stokMinimum: z.number().int().min(0).default(0),
    // Aktifkan bila stok menu ini ingin dipotong & divalidasi saat penjualan.
    trackStok: z.boolean().default(false),
    imageUrl: z.string().trim().max(255).optional(),
    // Royalty point opsional.
    royaltyPoint: z.number().int().min(0).optional(),
    // Produk khusus: bila true, wajib sertakan rentang tanggal.
    isProdukKhusus: z.boolean().default(false),
    produkKhususMulai: dateString.optional(),
    produkKhususSelesai: dateString.optional(),
    catatan: z.string().trim().max(500).optional(),
    // Resep makanan opsional — dibuat sekaligus dalam satu transaksi.
    resep: z
      .array(
        z.object({
          bahanId: z.number().int().positive(),
          jumlahPakai: decimalString,
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isProdukKhusus) {
      if (!data.produkKhususMulai || !data.produkKhususSelesai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Produk khusus wajib menyertakan produkKhususMulai dan produkKhususSelesai',
          path: ['produkKhususMulai'],
        });
      } else if (data.produkKhususMulai > data.produkKhususSelesai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'produkKhususMulai tidak boleh setelah produkKhususSelesai',
          path: ['produkKhususSelesai'],
        });
      }
    }
  });

export const updateMenuSchema = z
  .object({
    namaMenu: z.string().trim().min(1).max(100).optional(),
    kategori: kategoriString.optional(),
    harga: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    stok: z.number().int().min(0).optional(),
    stokMinimum: z.number().int().min(0).optional(),
    trackStok: z.boolean().optional(),
    imageUrl: z.string().trim().max(255).nullable().optional(),
    royaltyPoint: z.number().int().min(0).nullable().optional(),
    isProdukKhusus: z.boolean().optional(),
    produkKhususMulai: dateString.nullable().optional(),
    produkKhususSelesai: dateString.nullable().optional(),
    catatan: z.string().trim().max(500).nullable().optional(),
    // Bila dikirim, resep menu diganti total (replace). Array kosong = kosongkan.
    resep: z
      .array(
        z.object({
          bahanId: z.number().int().positive(),
          jumlahPakai: decimalString,
        }),
      )
      .optional(),
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
