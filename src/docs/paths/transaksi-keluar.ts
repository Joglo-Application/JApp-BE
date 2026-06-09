import { commonResponses, idPathParam } from '../components';

export const transaksiKeluarPaths = {
  '/transaksi-keluar': {
    get: {
      tags: ['Transaksi Keluar'],
      summary: 'List transaksi bahan keluar',
      description: 'Termasuk pengeluaran otomatis dari penjualan (`sale`) dan manual (waste/dll).',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'bahanId', in: 'query', schema: { type: 'integer' } },
        {
          name: 'tipeKeluar',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['sale', 'waste', 'damaged', 'expired', 'adjustment'],
          },
        },
      ],
      responses: {
        '200': {
          description: 'List transaksi keluar',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Transaksi Keluar'],
      summary: 'Create transaksi bahan keluar (manual)',
      description:
        '**Admin only.** Pengeluaran bahan manual (waste/damaged/expired/adjustment): ' +
        '**mengurangi stok** dan mencatat transaksi. Tipe `sale` tidak diperbolehkan. Atomik.',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateTransaksiKeluarInput' } },
        },
      },
      responses: {
        '201': {
          description: 'Transaksi keluar dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/TransaksiKeluar' } } },
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
  '/transaksi-keluar/{id}': {
    get: {
      tags: ['Transaksi Keluar'],
      summary: 'Get transaksi keluar by ID',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Detail transaksi keluar',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/TransaksiKeluar' } } },
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
