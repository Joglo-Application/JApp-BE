import { z } from 'zod';

export const loyaltyTipeSchema = z.enum(['diskon', 'produk_gratis']);
const diskonTipeSchema = z.enum(['amount', 'percent']);

const baseReward = {
  nama: z.string().trim().min(1).max(100),
  tipe: loyaltyTipeSchema,
  poin: z.number().int().positive('Poin harus lebih dari 0'),
  diskonTipe: diskonTipeSchema.optional(),
  diskonNilai: z.number().positive().optional(),
  menuId: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
};

/** Reward `diskon` wajib punya nilai; `produk_gratis` wajib menunjuk menu. */
const rewardRefinement = (d: {
  tipe: 'diskon' | 'produk_gratis';
  diskonTipe?: string;
  diskonNilai?: number;
  menuId?: number;
}) =>
  d.tipe === 'diskon'
    ? d.diskonTipe !== undefined && d.diskonNilai !== undefined
    : d.menuId !== undefined;

export const createRewardSchema = z.object(baseReward).refine(rewardRefinement, {
  message:
    'Reward diskon wajib mengisi diskonTipe & diskonNilai; produk gratis wajib mengisi menuId',
});

export const updateRewardSchema = z
  .object({
    nama: z.string().trim().min(1).max(100).optional(),
    tipe: loyaltyTipeSchema.optional(),
    poin: z.number().int().positive().optional(),
    diskonTipe: diskonTipeSchema.nullable().optional(),
    diskonNilai: z.number().positive().nullable().optional(),
    menuId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const rewardIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listRewardQuerySchema = z.object({
  all: z.enum(['true', 'false']).optional(),
});

export const redeemSchema = z.object({
  memberId: z.number().int().positive(),
  rewardId: z.number().int().positive(),
  /** Pesanan tempat reward dipakai (opsional, untuk penelusuran). */
  pesananId: z.number().int().positive().optional(),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
