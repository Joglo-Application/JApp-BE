export const healthPaths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Healthcheck',
      description: 'Cek apakah server hidup. Tidak butuh autentikasi.',
      security: [],
      responses: {
        '200': {
          description: 'Server hidup',
          content: {
            'application/json': {
              example: {
                success: true,
                data: {
                  status: 'ok',
                  service: 'pos-api',
                  env: 'development',
                  timestamp: '2026-05-25T10:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  },
};
