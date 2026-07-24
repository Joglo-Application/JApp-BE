import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/config/database';
import { pengaturan } from '@/db/schema/pengaturan';
import { BadRequestError } from '@/shared/errors';
import { GRUP_SCHEMAS, type GrupPengaturan } from './pengaturan.schema';

type GrupNilai<G extends GrupPengaturan> = z.infer<(typeof GRUP_SCHEMAS)[G]>;

/** Nilai default sebuah grup — hasil parse objek kosong lewat skema Zod. */
function defaultGrup<G extends GrupPengaturan>(grup: G): GrupNilai<G> {
  return GRUP_SCHEMAS[grup].parse({}) as GrupNilai<G>;
}

/**
 * Membaca satu grup pengaturan. Bila belum pernah disimpan, mengembalikan
 * nilai default sehingga frontend selalu dapat bentuk yang lengkap. Generic
 * agar tipe hasil menyempit sesuai [grup] (mis. getGrup('pajak') → PajakNilai).
 */
export async function getGrup<G extends GrupPengaturan>(
  grup: G,
): Promise<GrupNilai<G>> {
  const [row] = await db
    .select()
    .from(pengaturan)
    .where(eq(pengaturan.grup, grup))
    .limit(1);

  if (!row) return defaultGrup(grup);

  // Nilai tersimpan digabung dengan default agar field baru tetap terisi.
  const parsed = GRUP_SCHEMAS[grup].safeParse({
    ...defaultGrup(grup),
    ...(row.nilai as Record<string, unknown>),
  });
  return (parsed.success ? parsed.data : defaultGrup(grup)) as GrupNilai<G>;
}

/** Seluruh grup pengaturan sekaligus. */
export async function getSemua() {
  const grup = Object.keys(GRUP_SCHEMAS) as GrupPengaturan[];
  const hasil = await Promise.all(grup.map((g) => getGrup(g)));
  return Object.fromEntries(grup.map((g, i) => [g, hasil[i]]));
}

/**
 * Menyimpan satu grup. Input digabung dengan nilai lama sehingga pengiriman
 * sebagian field tidak menghapus field lainnya.
 */
export async function simpanGrup(grup: GrupPengaturan, input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new BadRequestError('Body pengaturan harus berupa objek');
  }

  const lama = await getGrup(grup);
  const hasil = GRUP_SCHEMAS[grup].safeParse({
    ...(lama as Record<string, unknown>),
    ...(input as Record<string, unknown>),
  });
  if (!hasil.success) {
    throw new BadRequestError(
      `Pengaturan "${grup}" tidak valid: ${hasil.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  await db
    .insert(pengaturan)
    .values({ grup, nilai: hasil.data })
    .onConflictDoUpdate({
      target: pengaturan.grup,
      set: { nilai: hasil.data },
    });

  return hasil.data;
}
