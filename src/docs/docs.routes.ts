import { Hono } from 'hono';
import { getOpenApiSpec } from './openapi';
import type { AppBindings } from '@/types/hono';

export const docsRoutes = new Hono<AppBindings>();

docsRoutes.get('/openapi.json', (c) => c.json(getOpenApiSpec()));

// Custom Swagger UI page. We render it ourselves (instead of @hono/swagger-ui)
// so we can inject CSS that hides the "Servers" dropdown — OpenAPI always
// defaults to a server, so the only way to hide the box is in the UI itself.
const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>POS API — Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    /* Hide the Servers dropdown (the Authorize button stays visible) */
    .swagger-ui .servers,
    .swagger-ui .servers-title { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;

docsRoutes.get('/', (c) => c.html(SWAGGER_HTML));
