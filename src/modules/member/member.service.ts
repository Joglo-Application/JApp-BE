import { count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/config/database';
import { member } from '@/db/schema/member';
import { memberPoinLog } from '@/db/schema/member-poin-log';
import { pesanan } from '@/db/schema/pesanan';
import { pembayaran } from '@/db/schema/pembayaran';
import { kodeTransaksi } from '../transaksi/transaksi.service';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type {
  AdjustPoinInput,
  CreateMemberInput,
  ListMemberQuery,
  UpdateMemberInput,
} from './member.schema';

export async function listMember(query: ListMemberQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = query.q
    ? or(ilike(member.nama, `%${query.q}%`), ilike(member.noTelp, `%${query.q}%`))
    : undefined;

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(member)
      .where(whereClause)
      .orderBy(desc(member.memberId))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(member).where(whereClause),
  ]);

  return { data, pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) } };
}

export async function getMemberById(id: number) {
  const [row] = await db.select().from(member).where(eq(member.memberId, id)).limit(1);
  if (!row) throw new NotFoundError('Member tidak ditemukan');

  const riwayatPoin = await db
    .select()
    .from(memberPoinLog)
    .where(eq(memberPoinLog.memberId, id))
    .orderBy(desc(memberPoinLog.poinLogId))
    .limit(50);

  return { ...row, riwayatPoin };
}

async function assertTelpUnique(noTelp: string, exceptId?: number) {
  const [existing] = await db
    .select({ id: member.memberId })
    .from(member)
    .where(eq(member.noTelp, noTelp))
    .limit(1);
  if (existing && existing.id !== exceptId) {
    throw new ConflictError(`No. telp "${noTelp}" sudah terdaftar`);
  }
}

export async function createMember(input: CreateMemberInput) {
  if (input.noTelp) await assertTelpUnique(input.noTelp);

  const [created] = await db
    .insert(member)
    .values({
      nama: input.nama,
      noTelp: input.noTelp ?? null,
      email: input.email ?? null,
      poin: 0,
    })
    .returning();
  return created;
}

export async function updateMember(id: number, input: UpdateMemberInput) {
  const [existing] = await db.select().from(member).where(eq(member.memberId, id)).limit(1);
  if (!existing) throw new NotFoundError('Member tidak ditemukan');
  if (input.noTelp) await assertTelpUnique(input.noTelp, id);

  const [updated] = await db.update(member).set(input).where(eq(member.memberId, id)).returning();
  return updated;
}

export async function deleteMember(id: number) {
  const [existing] = await db.select().from(member).where(eq(member.memberId, id)).limit(1);
  if (!existing) throw new NotFoundError('Member tidak ditemukan');
  await db.delete(member).where(eq(member.memberId, id));
}

/** Label metode pembayaran sesuai yang ditampilkan frontend. */
const metodeLabel: Record<string, string> = {
  cash: 'TUNAI',
  qris: 'QRIS',
  qris_netzme: 'QRIS',
  debit: 'Debit',
  transfer: 'Transfer',
};

/**
 * Riwayat transaksi seorang member (tab "Riwayat" di layar pilih member).
 * Hanya pesanan yang sudah dibayar yang dihitung sebagai transaksi.
 */
export async function listTransaksiMember(id: number) {
  await getMemberById(id);

  const rows = await db
    .select({
      pesananId: pesanan.pesananId,
      createdAt: pesanan.createdAt,
      total: pesanan.total,
      metode: pembayaran.metode,
      returAt: pesanan.returAt,
    })
    .from(pesanan)
    .innerJoin(pembayaran, eq(pembayaran.pesananId, pesanan.pesananId))
    .where(eq(pesanan.memberId, id))
    .orderBy(desc(pesanan.createdAt))
    .limit(100);

  return rows.map((r) => ({
    kodeTransaksi: kodeTransaksi(r.pesananId),
    waktu: r.createdAt.toISOString(),
    total: r.total,
    tipePembayaran: metodeLabel[r.metode] ?? r.metode,
    isReturned: r.returAt !== null,
  }));
}

/**
 * Menyesuaikan poin member (earn/redeem/adjustment) sekaligus mencatat log.
 * Redeem memvalidasi poin mencukupi. Atomik.
 */
export async function adjustPoin(id: number, input: AdjustPoinInput) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(member).where(eq(member.memberId, id)).limit(1);
    if (!row) throw new NotFoundError('Member tidak ditemukan');

    const delta = input.tipe === 'redeem' ? -input.poin : input.poin;
    const nextPoin = row.poin + delta;
    if (nextPoin < 0) {
      throw new BadRequestError(`Poin tidak mencukupi (tersedia ${row.poin}, diminta ${input.poin})`);
    }

    await tx.update(member).set({ poin: nextPoin }).where(eq(member.memberId, id));
    await tx.insert(memberPoinLog).values({
      memberId: id,
      tipe: input.tipe,
      poin: input.poin,
      pesananId: input.pesananId ?? null,
    });

    return getMemberById(id);
  });
}
