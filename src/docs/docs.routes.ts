import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { getOpenApiSpec } from './openapi';
import type { AppBindings } from '@/types/hono';

export const docsRoutes = new Hono<AppBindings>();

docsRoutes.get('/openapi.json', (c) => c.json(getOpenApiSpec()));

docsRoutes.get(
  '/',
  swaggerUI({
    url: '/docs/openapi.json',
    persistAuthorization: true,
  }),
);
