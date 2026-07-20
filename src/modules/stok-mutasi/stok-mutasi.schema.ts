import { z } from 'zod';

const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const rentangQuerySchema = z.object({
  start: tanggalSchema.optional(),
  end: tanggalSchema.optional(),
  status: z.enum(['draft', 'posted', 'cancelled']).optional(),
});

/** Item dokumen: `inventori` menunjuk menu, `stok_gudang` menunjuk bahan baku. */
const itemBase = {
  sumber: z.enum(['inventori', 'stok_gudang']),
  menuId: z.number().int().positive().optional(),
  bahanId: z.number().int().positive().optional(),
  jumlah: z.number().int().positive(),
};

const cocokSumber = (d: { sumber: string; menuId?: number; bahanId?: number }) =>
  d.sumber === 'inventori' ? d.menuId !== undefined : d.bahanId !== undefined;

const pesanSumber = {
  message: 'Item sumber "inventori" wajib mengisi menuId; "stok_gudang" wajib mengisi bahanId',
};

export const stokMasukItemSchema = z.object(itemBase).refine(cocokSumber, pesanSumber);

export const stokKeluarItemSchema = z
  .object({ ...itemBase, harga: z.number().int().min(0).default(0) })
  .refine(cocokSumber, pesanSumber);

export const createStokMasukSchema = z.object({
  supplier: z.string().trim().max(100).optional(),
  catatan: z.string().trim().max(500).optional(),
  /** true = langsung diposting (stok ikut berubah), false = simpan sebagai draft. */
  langsungPosting: z.boolean().default(false),
  items: z.array(stokMasukItemSchema).min(1, 'Dokumen harus memiliki minimal satu item'),
});

export const createStokKeluarSchema = z.object({
  catatan: z.string().trim().max(500).optional(),
  langsungPosting: z.boolean().default(false),
  items: z.array(stokKeluarItemSchema).min(1, 'Dokumen harus memiliki minimal satu item'),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type RentangQuery = z.infer<typeof rentangQuerySchema>;
export type CreateStokMasukInput = z.infer<typeof createStokMasukSchema>;
export type CreateStokKeluarInput = z.infer<typeof createStokKeluarSchema>;
