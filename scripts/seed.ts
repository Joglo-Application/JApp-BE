import 'dotenv/config';
import { seed } from '@/db/seed';
import { closeDatabase } from '@/config/database';

async function main(): Promise<void> {
  try {
    await seed();
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    await closeDatabase();
    process.exit(1);
  }
}

void main();
