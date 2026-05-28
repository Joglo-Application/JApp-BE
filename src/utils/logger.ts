import pino from 'pino';
import { env, isDev } from '@/config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    app: env.APP_NAME,
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname,app,env',
      },
    },
  }),
});

export type Logger = typeof logger;
