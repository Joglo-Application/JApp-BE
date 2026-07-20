import { z } from 'zod';

export const transaksiQuerySchema = z.object({
  // Tanggal tunggal (YYYY-MM-DD). Default: hari ini bila tidak dikirim.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
});

/** Param kode transaksi: menerima "TRX-0001" maupun angka polos. */
export const transaksiKodeParamSchema = z.object({
  kode: z.string().regex(/^(TRX-)?\d+$/i, 'Kode transaksi tidak valid'),
});

export const returTransaksiSchema = z.object({
  alasan: z.string().trim().min(3, 'Alasan retur minimal 3 karakter').max(255),
  // PIN persetujuan supervisor — retur mengubah stok & kas, jadi wajib disetujui.
  pin: z.string().regex(/^\d{4,8}$/, 'PIN harus 4-8 digit angka'),
});

export type TransaksiQuery = z.infer<typeof transaksiQuerySchema>;
export type ReturTransaksiInput = z.infer<typeof returTransaksiSchema>;
