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
      description: 'Tambah bahan baku baru. Role: **admin, gudang**.',
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
      description: 'Role: **admin, gudang**.',
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
  '/bahan-baku/{id}/tambah-stok': {
    patch: {
      tags: ['Bahan Baku'],
      summary: 'Tambah stok bahan baku (atomik)',
      description:
        'Menambah stok: `stok = stok + jumlah`. Dipakai halaman "Tambah Stok Gudang" ' +
        '(hanya produk + jumlah). Role: **admin, gudang**.',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['jumlah'],
              properties: {
                jumlah: { type: 'number', example: 50, description: 'Positif, maks 3 desimal' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Stok bertambah',
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
  },
};
