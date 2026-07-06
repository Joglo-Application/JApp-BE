import { z } from 'zod';

/** 23 jenis aksi POS yang diaudit (sesuai daftar Transaction Type di FE). */
export const LOG_TIPE = [
  'ADD_QTY',
  'REDUCE_QTY',
  'UPDATE_PRICE',
  'DISC_PCT_ITEM',
  'DISC_AMT_ITEM',
  'DISC_PCT',
  'DISC_AMT',
  'DISC_VOUCHER',
  'DISC_VOUCHER_PCT_ITEM',
  'DISC_VOUCHER_AMT_ITEM',
  'VOID_ORDER',
  'VOID_ITEM',
  'VOID_ADDON',
  'FULL_REFUND',
  'PARTIAL_REFUND',
  'SPLIT_ORDER',
  'APPLY_TAX',
  'APPLY_SVC_CHARGE',
  'REMOVE_TAX',
  'REMOVE_SVC_CHARGE',
  'UPDATE_PAYMENT',
  'SEND_KITCHEN',
  'PRINT_CHECK',
] as const;

export const createLogSchema = z.object({
  tipe: z.enum(LOG_TIPE),
  // Kode sesi order dari FE (bukan FK pesanan).
  kodeTransaksi: z.string().trim().min(1).max(50),
  deskripsi: z.string().trim().min(1).max(2000),
});

export const listLogQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  tipe: z.enum(LOG_TIPE).optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type ListLogQuery = z.infer<typeof listLogQuerySchema>;
