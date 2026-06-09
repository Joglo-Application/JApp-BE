import { commonResponses, idPathParam } from '../components';

export const transaksiMasukPaths = {
  '/transaksi-masuk': {
    get: {
      tags: ['Transaksi Masuk'],
      summary: 'List transaksi bahan masuk',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'bahanId', in: 'query', schema: { type: 'integer' } },
      ],
      responses: {
        '200': {
          description: 'List transaksi masuk',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Transaksi Masuk'],
      summary: 'Create transaksi bahan masuk (tanpa PO)',
      description:
        '**Admin only.** Penerimaan bahan langsung tanpa PO: mencatat transaksi, ' +
        '**menambah stok**, dan memperbarui harga satuan bahan. Atomik.',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateTransaksiMasukInput' } },
        },
      },
      responses: {
        '201': {
          description: 'Transaksi masuk dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/TransaksiMasuk' } } },
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
  '/transaksi-masuk/{id}': {
    get: {
      tags: ['Transaksi Masuk'],
      summary: 'Get transaksi masuk by ID',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Detail transaksi masuk',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/TransaksiMasuk' } } },
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
};
