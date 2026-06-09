import { commonResponses, idPathParam } from '../components';

export const pesananBahanPaths = {
  '/pesanan-bahan': {
    get: {
      tags: ['Pesanan Bahan (PO)'],
      summary: 'List purchase order',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['pending', 'received', 'cancelled'] },
        },
      ],
      responses: {
        '200': {
          description: 'List PO',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Pesanan Bahan (PO)'],
      summary: 'Create purchase order',
      description: '**Admin only.** Membuat PO ke supplier (status `pending`). Belum mengubah stok.',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreatePesananBahanInput' } },
        },
      },
      responses: {
        '201': {
          description: 'PO dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/PesananBahan' } } },
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
  '/pesanan-bahan/{id}': {
    get: {
      tags: ['Pesanan Bahan (PO)'],
      summary: 'Get purchase order by ID',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Detail PO',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/PesananBahan' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '404': commonResponses.NotFound,
      },
    },
  },
  '/pesanan-bahan/{id}/receive': {
    post: {
      tags: ['Pesanan Bahan (PO)'],
      summary: 'Receive (terima) purchase order',
      description:
        '**Admin only.** Menerima barang dari PO `pending`: mencatat transaksi bahan masuk, ' +
        '**menambah stok** bahan, memperbarui harga satuan bahan ke harga beli, dan menandai PO `received`. Atomik.',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ReceivePesananBahanInput' } },
        },
      },
      responses: {
        '200': {
          description: 'PO diterima',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/PesananBahan' } } },
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
  },
  '/pesanan-bahan/{id}/cancel': {
    post: {
      tags: ['Pesanan Bahan (PO)'],
      summary: 'Cancel purchase order',
      description: '**Admin only.** Membatalkan PO yang masih `pending`. Tidak mengubah stok.',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'PO dibatalkan',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/PesananBahan' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': commonResponses.Conflict,
      },
    },
  },
};
