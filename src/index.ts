import { serve } from '@hono/node-server';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { closeDatabase } from '@/config/database';

const app = createApp();

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info(
      { port: info.port, env: env.NODE_ENV },
      `${env.APP_NAME} running at http://localhost:${info.port}`,
    );
  },
);

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});
