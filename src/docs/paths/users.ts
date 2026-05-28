import { commonResponses, idPathParam, paginationParams } from '../components';

export const usersPaths = {
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List users',
      description: 'List users dengan pagination & search. **Admin only.**',
      parameters: [...paginationParams],
      responses: {
        '200': {
          description: 'List users',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaginatedResponse' },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Create user',
      description: 'Buat user baru. **Admin only.**',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUserInput' },
          },
        },
      },
      responses: {
        '201': {
          description: 'User dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '409': {
          description: 'Username sudah terpakai',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: { code: 'CONFLICT', message: 'Username sudah terpakai' },
              },
            },
          },
        },
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Detail user. **Admin only.**',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'User detail',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update user',
      description: 'Update user (partial). **Admin only.**',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateUserInput' },
          },
        },
      },
      responses: {
        '200': {
          description: 'User updated',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': commonResponses.Conflict,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete user',
      description: 'Hapus user. **Admin only.**',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'User deleted',
          content: {
            'application/json': {
              example: { success: true, data: { deleted: true } },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
};
