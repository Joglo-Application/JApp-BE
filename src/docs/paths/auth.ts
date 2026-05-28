import { commonResponses } from '../components';

export const authPaths = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      description: 'Login dengan username & password untuk mendapatkan JWT token.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginInput' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login berhasil',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/LoginResponse' } },
                  },
                ],
              },
              example: {
                success: true,
                data: {
                  token: 'eyJhbGciOiJIUzI1NiIs...',
                  user: {
                    userId: 1,
                    namaUser: 'Administrator',
                    username: 'admin',
                    role: 'admin',
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Username/password salah',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Username atau password salah' },
              },
            },
          },
        },
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user',
      description: 'Get info user yang sedang login berdasarkan JWT token.',
      responses: {
        '200': {
          description: 'User info',
          content: {
            'application/json': {
              example: {
                success: true,
                data: {
                  userId: 1,
                  namaUser: 'Administrator',
                  username: 'admin',
                  role: 'admin',
                  createdAt: '2026-05-22T07:42:21.421Z',
                },
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
  },
};
