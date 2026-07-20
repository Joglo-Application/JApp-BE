import { and, count, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/config/database';
import { meja } from '@/db/schema/meja';
import { pesanan } from '@/db/schema/pesanan';
import { detailPesanan } from '@/db/schema/detail-pesanan';
import { menus } from '@/db/schema/menus';
import { reservasi } from '@/db/schema/reservasi';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { getPaginationParams } from '@/shared/pagination';
import type {
  CreateMejaInput,
  CreateReservasiInput,
  ListMejaQuery,
  UpdateMejaInput,
} from './meja.schema';

export async function listMeja(query: ListMejaQuery) {
  const { limit, offset, page } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });
  const whereClause = and(
    query.zona ? eq(meja.zona, query.zona) : undefined,
    query.status ? eq(meja.status, query.status) : undefined,
  );

  const [data, totalRows] = await Promise.all([
    db.select().from(meja).where(whereClause).orderBy(asc(meja.mejaId)).limit(limit).offset(offset),
    db.select({ count: count() }).from(meja).where(whereClause),
  ]);

  return { data, pagination: { page, limit, total: Number(totalRows[0]?.count ?? 0) } };
}

export async function getMejaById(id: number) {
  const [row] = await db.select().from(meja).where(eq(meja.mejaId, id)).limit(1);
  if (!row) throw new NotFoundError('Meja tidak ditemukan');
  return row;
}

export async function createMeja(input: CreateMejaInput) {
  const [existing] = await db
    .select({ id: meja.mejaId })
    .from(meja)
    .where(eq(meja.nomor, input.nomor))
    .limit(1);
  if (existing) throw new ConflictError(`Meja "${input.nomor}" sudah ada`);

  const [created] = await db
    .insert(meja)
    .values({
      nomor: input.nomor,
      zona: input.zona ?? null,
      kapasitas: input.kapasitas,
      status: input.status,
    })
    .returning();
  return created;
}

export async function updateMeja(id: number, input: UpdateMejaInput) {
  await getMejaById(id);
  const [updated] = await db.update(meja).set(input).where(eq(meja.mejaId, id)).returning();
  return updated;
}

export async function updateMejaStatus(
  id: number,
  status: 'available' | 'occupied' | 'reserved' | 'blocked',
) {
  await getMejaById(id);
  const [updated] = await db.update(meja).set({ status }).where(eq(meja.mejaId, id)).returning();
  return updated;
}

export async function deleteMeja(id: number) {
  await getMejaById(id);
  await db.delete(meja).where(eq(meja.mejaId, id));
}

/**
 * Pesanan aktif pada sebuah meja beserta itemnya, total tamu, dan reservasi
 * aktif. Menggantikan data mock panel detail meja di FE — yang selalu kosong
 * di produksi karena memakai key string sedangkan id meja numerik.
 */
export async function listPesananMeja(mejaId: number) {
  const mejaRow = await getMejaById(mejaId);

  const orders = await db
    .select({
      pesananId: pesanan.pesananId,
      createdAt: pesanan.createdAt,
      status: pesanan.status,
      subtotal: pesanan.subtotal,
      serviceCharge: pesanan.serviceCharge,
      pajak: pesanan.pajak,
      diskon: pesanan.diskon,
      total: pesanan.total,
      jumlahTamu: pesanan.jumlahTamu,
      customerNama: pesanan.customerNama,
    })
    .from(pesanan)
    .where(and(eq(pesanan.mejaId, mejaId), eq(pesanan.status, 'in_progress')))
    .orderBy(asc(pesanan.createdAt));

  const ids = orders.map((o) => o.pesananId);
  const details = ids.length
    ? await db
        .select({
          pesananId: detailPesanan.pesananId,
          jumlah: detailPesanan.jumlah,
          hargaSatuan: detailPesanan.hargaSatuan,
          subtotal: detailPesanan.subtotal,
          namaMenu: menus.namaMenu,
          namaCustom: detailPesanan.namaCustom,
        })
        .from(detailPesanan)
        .leftJoin(menus, eq(menus.menuId, detailPesanan.menuId))
        .where(inArray(detailPesanan.pesananId, ids))
    : [];

  const itemsByPesanan = new Map<number, unknown[]>();
  for (const d of details) {
    const list = itemsByPesanan.get(d.pesananId) ?? [];
    list.push({
      nama: d.namaMenu ?? d.namaCustom ?? '',
      qty: d.jumlah,
      hargaSatuan: d.hargaSatuan,
      total: d.subtotal,
    });
    itemsByPesanan.set(d.pesananId, list);
  }

  const [reservasiAktif] = await db
    .select()
    .from(reservasi)
    .where(and(eq(reservasi.mejaId, mejaId), eq(reservasi.aktif, true)))
    .limit(1);

  return {
    meja: {
      mejaId: mejaRow.mejaId,
      nomor: mejaRow.nomor,
      zona: mejaRow.zona,
      kapasitas: mejaRow.kapasitas,
      status: mejaRow.status,
    },
    jumlahTamu: orders.reduce((sum, o) => sum + (o.jumlahTamu ?? 0), 0),
    pesanan: orders.map((o) => ({
      pesananId: o.pesananId,
      kodeTransaksi: `TRX-${String(o.pesananId).padStart(4, '0')}`,
      waktu: o.createdAt.toISOString(),
      status: o.status,
      namaKontak: o.customerNama ?? '',
      jumlahTamu: o.jumlahTamu,
      subtotal: o.subtotal,
      biayaLayanan: o.serviceCharge,
      pajakToko: o.pajak,
      diskon: o.diskon,
      total: o.total,
      items: itemsByPesanan.get(o.pesananId) ?? [],
    })),
    reservasi: reservasiAktif ?? null,
  };
}

/** Membuat reservasi meja dan menandai mejanya `reserved`. */
export async function createReservasi(
  userId: number,
  mejaId: number,
  input: CreateReservasiInput,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(meja).where(eq(meja.mejaId, mejaId)).limit(1);
    if (!row) throw new NotFoundError('Meja tidak ditemukan');
    if (row.status === 'occupied') {
      throw new ConflictError('Meja sedang dipakai, tidak dapat direservasi');
    }

    // Satu reservasi aktif per meja — yang lama otomatis ditutup.
    await tx
      .update(reservasi)
      .set({ aktif: false })
      .where(and(eq(reservasi.mejaId, mejaId), eq(reservasi.aktif, true)));

    const [created] = await tx
      .insert(reservasi)
      .values({ ...input, mejaId, userId })
      .returning();

    await tx.update(meja).set({ status: 'reserved' }).where(eq(meja.mejaId, mejaId));

    return created;
  });
}

/** Membatalkan reservasi aktif dan membebaskan mejanya. */
export async function cancelReservasi(mejaId: number) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(reservasi)
      .where(and(eq(reservasi.mejaId, mejaId), eq(reservasi.aktif, true)))
      .limit(1);
    if (!row) throw new NotFoundError('Tidak ada reservasi aktif pada meja ini');

    await tx
      .update(reservasi)
      .set({ aktif: false })
      .where(eq(reservasi.reservasiId, row.reservasiId));

    // Bebaskan meja hanya bila statusnya memang masih `reserved`.
    await tx
      .update(meja)
      .set({ status: 'available' })
      .where(and(eq(meja.mejaId, mejaId), eq(meja.status, 'reserved')));
  });
}
