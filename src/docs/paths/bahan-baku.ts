import { commonResponses, idPathParam, paginationParams } from '../components';

export const bahanBakuPaths = {
  '/bahan-baku': {
    get: {
      tags: ['Bahan Baku'],
      summary: 'List bahan baku',
      description: 'List bahan baku dengan pagination & search.',
      parameters: [...paginationParams],
      responses: {
        '200': {
          description: 'List bahan baku',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaginatedResponse' },
            },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Bahan Baku'],
      summary: 'Create bahan baku',
      description: 'Tambah bahan baku baru. **Admin only.**',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateBahanBakuInput' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Bahan baku dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/BahanBaku' } } },
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
  '/bahan-baku/{id}': {
    get: {
      tags: ['Bahan Baku'],
      summary: 'Get bahan baku by ID',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Bahan baku detail',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/BahanBaku' } } },
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
      tags: ['Bahan Baku'],
      summary: 'Update bahan baku',
      description: '**Admin only.**',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateBahanBakuInput' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/BahanBaku' } } },
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
      tags: ['Bahan Baku'],
      summary: 'Delete bahan baku',
      description: '**Admin only.** Akan gagal jika bahan masih dipakai di resep/transaksi.',
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
};
