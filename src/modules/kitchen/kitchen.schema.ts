import { z } from 'zod';

export const kitchenOrdersQuerySchema = z.object({
  /** Filter tanggal pesanan (YYYY-MM-DD). Default: semua order aktif. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  /**
   * Cakupan status: `in_progress` (default, layar Dapur), `completed`, atau
   * `all` (tab Transaksi — sedang diproses + sudah selesai).
   */
  status: z.enum(['in_progress', 'completed', 'all']).optional(),
});

export const kitchenItemParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  detailId: z.coerce.number().int().positive(),
});

export const kitchenItemDoneSchema = z.object({
  /** `false` untuk membatalkan centang. Default `true`. */
  selesai: z.boolean().default(true),
});

export type KitchenOrdersQuery = z.infer<typeof kitchenOrdersQuerySchema>;
export type KitchenItemDoneInput = z.infer<typeof kitchenItemDoneSchema>;
