import { commonResponses, idPathParam, paginationParams } from '../components';

const resepIdParam = {
  name: 'resepId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' },
  description: 'Resep ID',
};

export const menusPaths = {
  '/menus': {
    get: {
      tags: ['Menus'],
      summary: 'List menus',
      parameters: [...paginationParams],
      responses: {
        '200': {
          description: 'List menus',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Menus'],
      summary: 'Create menu',
      description: 'Role: **admin, owner**.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMenuInput' } } },
      },
      responses: {
        '201': {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/Menu' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/menus/{id}': {
    get: {
      tags: ['Menus'],
      summary: 'Get menu by ID (with resep)',
      description: 'Detail menu termasuk daftar resep (sub-resource).',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Menu detail dengan resep',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/MenuWithResep' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '404': commonResponses.NotFound,
      },
    },
    patch: {
      tags: ['Menus'],
      summary: 'Update menu',
      description: 'Role: **admin, owner**.',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMenuInput' } } },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/Menu' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Menus'],
      summary: 'Delete menu',
      description: 'Role: **admin, owner**. Resep ikut terhapus (cascade). Gagal jika menu pernah dipesan.',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Deleted',
          content: { 'application/json': { example: { success: true, data: { deleted: true } } } },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
  '/menus/{id}/resep': {
    get: {
      tags: ['Resep Menu'],
      summary: 'List resep menu',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'List resep',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/ResepItem' } },
                    },
                  },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '404': commonResponses.NotFound,
      },
    },
    post: {
      tags: ['Resep Menu'],
      summary: 'Add resep ke menu',
      description: 'Role: **admin, owner**.',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateResepInput' } } },
      },
      responses: {
        '201': {
          description: 'Resep ditambahkan',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': {
          description: 'Bahan sudah ada di resep',
          content: {
            'application/json': {
              example: {
                success: false,
                error: { code: 'CONFLICT', message: 'Bahan ini sudah ada di resep menu' },
              },
            },
          },
        },
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/menus/{id}/resep/{resepId}': {
    patch: {
      tags: ['Resep Menu'],
      summary: 'Update jumlah pakai resep',
      description: 'Role: **admin, owner**.',
      parameters: [idPathParam, resepIdParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateResepInput' } } },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Resep Menu'],
      summary: 'Hapus resep dari menu',
      description: 'Role: **admin, owner**.',
      parameters: [idPathParam, resepIdParam],
      responses: {
        '200': {
          description: 'Deleted',
          content: { 'application/json': { example: { success: true, data: { deleted: true } } } },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
};
