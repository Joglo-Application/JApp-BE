import { desc, eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { loyaltyReward } from '@/db/schema/loyalty-reward';
import { menus } from '@/db/schema/menus';
import { BadRequestError, NotFoundError } from '@/shared/errors';
import { adjustPoin } from '../member/member.service';
import type { CreateRewardInput, RedeemInput, UpdateRewardInput } from './loyalty.schema';

type RewardRow = typeof loyaltyReward.$inferSelect;

function toPublic(row: RewardRow, namaMenu?: string | null, hargaMenu?: number | null) {
  return {
    rewardId: row.rewardId,
    nama: row.nama,
    tipe: row.tipe,
    poin: row.poin,
    diskonTipe: row.diskonTipe,
    diskonNilai: row.diskonNilai === null ? null : Number(row.diskonNilai),
    menuId: row.menuId,
    namaMenu: namaMenu ?? null,
    // Harga menu ikut dikirim supaya kasir bisa memasukkan produk gratis ke
    // keranjang tanpa perlu mencari harganya sendiri.
    hargaMenu: hargaMenu ?? null,
    isActive: row.isActive,
  };
}

/** Daftar reward. Default hanya yang aktif (untuk POS). */
export async function listRewards(includeInactive = false) {
  const rows = await db
    .select({
      reward: loyaltyReward,
      namaMenu: menus.namaMenu,
      hargaMenu: menus.harga,
    })
    .from(loyaltyReward)
    .leftJoin(menus, eq(menus.menuId, loyaltyReward.menuId))
    .orderBy(desc(loyaltyReward.rewardId));

  return rows
    .filter((r) => includeInactive || r.reward.isActive)
    .map((r) => toPublic(r.reward, r.namaMenu, r.hargaMenu));
}

async function findReward(id: number) {
  const [row] = await db
    .select()
    .from(loyaltyReward)
    .where(eq(loyaltyReward.rewardId, id))
    .limit(1);
  if (!row) throw new NotFoundError('Reward tidak ditemukan');
  return row;
}

export async function createReward(input: CreateRewardInput) {
  if (input.menuId !== undefined) {
    const [menu] = await db
      .select({ id: menus.menuId })
      .from(menus)
      .where(eq(menus.menuId, input.menuId))
      .limit(1);
    if (!menu) throw new NotFoundError('Menu untuk produk gratis tidak ditemukan');
  }

  const [created] = await db
    .insert(loyaltyReward)
    .values({
      ...input,
      diskonNilai: input.diskonNilai === undefined ? null : String(input.diskonNilai),
    })
    .returning();
  return created ? toPublic(created) : null;
}

export async function updateReward(id: number, input: UpdateRewardInput) {
  await findReward(id);

  const updates: Partial<typeof loyaltyReward.$inferInsert> = {
    ...input,
    diskonNilai: undefined,
  };
  if (input.diskonNilai !== undefined) {
    updates.diskonNilai = input.diskonNilai === null ? null : String(input.diskonNilai);
  }

  const [updated] = await db
    .update(loyaltyReward)
    .set(updates)
    .where(eq(loyaltyReward.rewardId, id))
    .returning();
  return updated ? toPublic(updated) : null;
}

export async function deleteReward(id: number) {
  await findReward(id);
  await db.delete(loyaltyReward).where(eq(loyaltyReward.rewardId, id));
}

/**
 * Menukar poin member dengan sebuah reward. Pemotongan poin memakai
 * `adjustPoin` agar validasi kecukupan poin dan pencatatan `member_poin_log`
 * tetap satu jalur dengan penambahan poin.
 */
export async function redeemReward(input: RedeemInput) {
  const reward = await findReward(input.rewardId);
  if (!reward.isActive) throw new BadRequestError('Reward sedang tidak aktif');

  const member = await adjustPoin(input.memberId, {
    tipe: 'redeem',
    poin: reward.poin,
    pesananId: input.pesananId,
  });

  return { reward: toPublic(reward), member };
}
