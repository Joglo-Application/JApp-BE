import { z } from 'zod';

export const pesananItemSchema = z
  .object({
    menuId: z.number().int().positive().optional(),
    namaCustom: z.string().trim().min(1).max(100).optional(),
    hargaSatuan: z.number().int().min(0).optional(),
    jumlah: z.number().int().positive(),
    diskon: z.number().int().min(0).default(0),
    catatan: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.menuId !== undefined || (d.namaCustom && d.hargaSatuan !== undefined), {
    message: 'Item harus punya menuId, atau (namaCustom + hargaSatuan) untuk item custom',
  });

export const orderDiscountSchema = z.object({
  tipe: z.enum(['amount', 'percent']),
  nilai: z.number().min(0),
  promoNama: z.string().trim().max(100).optional(),
});

export const createPesananSchema = z
  .object({
    items: z.array(pesananItemSchema).min(1, 'Pesanan harus memiliki minimal satu item'),
    customerNama: z.string().trim().max(100).optional(),
    orderType: z
      .enum(['dine_in', 'take_away', 'gofood', 'grabfood', 'shopeefood'])
      .optional(),
    catatan: z.string().trim().max(500).optional(),
    mejaId: z.number().int().positive().optional(),
    memberId: z.number().int().positive().optional(),
    diskon: orderDiscountSchema.optional(),
  })
  // Pesanan dine-in wajib memilih meja.
  .refine((d) => d.orderType !== 'dine_in' || d.mejaId !== undefined, {
    message: 'Pesanan dine-in harus memilih nomor meja terlebih dahulu',
    path: ['mejaId'],
  });

export const pesananIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPesananQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  mejaId: z.coerce.number().int().positive().optional(),
});

export type PesananItemInput = z.infer<typeof pesananItemSchema>;
export type OrderDiscountInput = z.infer<typeof orderDiscountSchema>;
export type CreatePesananInput = z.infer<typeof createPesananSchema>;
export type ListPesananQuery = z.infer<typeof listPesananQuerySchema>;
