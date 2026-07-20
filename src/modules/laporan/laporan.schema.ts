import { z } from 'zod';

const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

/** Rentang tanggal laporan. Default: hari ini bila keduanya kosong. */
export const rentangQuerySchema = z
  .object({
    start: tanggalSchema.optional(),
    end: tanggalSchema.optional(),
  })
  .refine((d) => !d.start || !d.end || d.start <= d.end, {
    message: 'Tanggal mulai tidak boleh setelah tanggal akhir',
    path: ['end'],
  });

export const exportQuerySchema = z
  .object({
    jenis: z.enum(['ringkasan', 'produk', 'pembayaran', 'guest']),
    start: tanggalSchema.optional(),
    end: tanggalSchema.optional(),
  })
  .refine((d) => !d.start || !d.end || d.start <= d.end, {
    message: 'Tanggal mulai tidak boleh setelah tanggal akhir',
    path: ['end'],
  });

export type RentangQuery = z.infer<typeof rentangQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
