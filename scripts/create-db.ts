import 'dotenv/config';
import postgres from 'postgres';

/**
 * Creates the target database (from DATABASE_URL) if it does not exist.
 * Connects to the default `postgres` database to issue CREATE DATABASE.
 * Pure Node — no system `psql` client required.
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const dbName = new URL(url).pathname.replace(/^\//, '').split('?')[0];
  if (!dbName) {
    console.error('Could not determine database name from DATABASE_URL');
    process.exit(1);
  }

  const adminUrl = url.replace(`/${dbName}`, '/postgres');
  const sql = postgres(adminUrl, { max: 1 });

  try {
    const rows = await sql`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (rows.length === 0) {
      await sql.unsafe(`CREATE DATABASE "${dbName}"`);
      console.warn(`Created database "${dbName}"`);
    } else {
      console.warn(`Database "${dbName}" already exists`);
    }
  } catch (err) {
    console.error('Failed to create database:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

void main();
