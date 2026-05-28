import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env, isProd } from '@/config/env';
import { logger } from '@/utils/logger';
import * as schema from '@/db/schema';

const queryClient = postgres(env.DATABASE_URL, {
  max: isProd ? 20 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export const db = drizzle(queryClient, {
  schema,
  logger: !isProd
    ? {
        logQuery: (query, params) => {
          logger.debug({ query, params }, 'DB Query');
        },
      }
    : false,
});

export type Database = typeof db;

export async function closeDatabase(): Promise<void> {
  await queryClient.end();
  logger.info('Database connection closed');
}
