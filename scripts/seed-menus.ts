import 'dotenv/config';
import { db, closeDatabase } from '@/config/database';
import { menus } from '@/db/schema/menus';
import { wedanganMenuData } from '@/db/data/wedangan-menus';

/**
 * Insert HANYA menu Wedangan Joglo, tanpa menyentuh users/supplier/data lain.
 * Idempotent: menu yang namaMenu-nya sudah ada di DB dilewati, jadi aman
 * dijalankan berkali-kali dan aman di DB production yang sudah berisi data.
 *
 * Jalankan di server yang punya akses ke RDS (EC2), mis:
 *   pnpm exec tsx scripts/seed-menus.ts
 */
async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    const existing = await db.select({ namaMenu: menus.namaMenu }).from(menus);
    const existingNames = new Set(existing.map((m) => m.namaMenu));

    const toInsert = wedanganMenuData.filter((m) => !existingNames.has(m.namaMenu));

    if (toInsert.length === 0) {
      console.warn('Semua menu sudah ada. Tidak ada yang ditambahkan.');
    } else {
      const inserted = await db.insert(menus).values(toInsert).returning();
      console.warn(`  ${inserted.length} menu ditambahkan:`);
      for (const m of inserted) {
        console.warn(`    + [${m.kategori}] ${m.namaMenu} — ${m.harga}`);
      }
    }

    const skipped = wedanganMenuData.length - toInsert.length;
    if (skipped > 0) {
      console.warn(`  ${skipped} menu dilewati (sudah ada).`);
    }

    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Seed menu gagal:', err);
    await closeDatabase();
    process.exit(1);
  }
}

void main();
