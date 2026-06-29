import 'dotenv/config';
import postgres from 'postgres';
import { seed } from '@/db/seed';
import { closeDatabase } from '@/config/database';

/**
 * Reset database: hapus SEMUA data (TRUNCATE) + reset auto-increment, lalu seed
 * ulang data awal. Skema & riwayat migrasi Drizzle TIDAK disentuh (tidak perlu
 * migrate ulang).
 *
 * DESTRUKTIF & tidak bisa dibatalkan. Pakai DATABASE_URL dari environment.
 * Jalankan: node_modules/.bin/tsx scripts/reset-db.ts
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  try {
    // Semua tabel di schema public KECUALI tabel migrasi Drizzle.
    const tables = await sql<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT LIKE '%drizzle%'
    `;
    if (tables.length === 0) {
      console.warn('Tidak ada tabel untuk di-reset.');
    } else {
      const list = tables.map((t) => `"${t.tablename}"`).join(', ');
      console.warn(`Truncating: ${list}`);
      await sql.unsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
      console.warn('Semua data dihapus, identity di-reset.');
    }
  } catch (err) {
    console.error('Reset (truncate) gagal:', err);
    await sql.end();
    process.exit(1);
  }
  await sql.end();

  // Seed ulang data awal (admin/kasir, supplier, bahan baku, menu, resep).
  try {
    await seed();
    await closeDatabase();
    console.warn('Reset + seed selesai.');
    process.exit(0);
  } catch (err) {
    console.error('Seed gagal:', err);
    await closeDatabase();
    process.exit(1);
  }
}

void main();
