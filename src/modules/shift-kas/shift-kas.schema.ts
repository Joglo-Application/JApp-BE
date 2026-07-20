import { z } from 'zod';

export const startShiftSchema = z.object({
  kasAwal: z.number().int().min(0).default(0),
});

export const createEntrySchema = z.object({
  jenis: z.enum(['setoran', 'penarikan']),
  namaTransaksi: z.string().trim().min(1).max(100),
  jumlah: z.number().int().positive(),
  catatan: z.string().trim().max(1000).optional(),
});

export const updateEntrySchema = z
  .object({
    namaTransaksi: z.string().trim().min(1).max(100).optional(),
    jumlah: z.number().int().positive().optional(),
    catatan: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const listShiftQuerySchema = z.object({
  date: tanggalSchema.optional(),
  // Rentang tanggal untuk layar Riwayat Shift. Diabaikan bila `date` diisi.
  from: tanggalSchema.optional(),
  to: tanggalSchema.optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type StartShiftInput = z.infer<typeof startShiftSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type ListShiftQuery = z.infer<typeof listShiftQuerySchema>;
