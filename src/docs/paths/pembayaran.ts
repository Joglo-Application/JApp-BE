import { commonResponses, idPathParam } from '../components';

export const pembayaranPaths = {
  '/pembayaran': {
    get: {
      tags: ['Pembayaran'],
      summary: 'List pembayaran',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        {
          name: 'metode',
          in: 'query',
          schema: { type: 'string', enum: ['cash', 'qris', 'debit', 'transfer'] },
        },
      ],
      responses: {
        '200': {
          description: 'List pembayaran',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Pembayaran'],
      summary: 'Create pembayaran',
      description:
        '**Admin & Kasir.** Memproses pembayaran sebuah pesanan `pending`. ' +
        'Memvalidasi jumlah bayar >= total, menghitung kembalian, dan menandai ' +
        'pesanan menjadi `completed`. Atomik dalam satu transaksi DB.',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreatePembayaranInput' } },
        },
      },
      responses: {
        '201': {
          description: 'Pembayaran dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/Pembayaran' } },
                  },
                ],
              },
            },
          },
        },
        '400': commonResponses.ValidationError,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': commonResponses.Conflict,
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/pembayaran/{id}': {
    get: {
      tags: ['Pembayaran'],
      summary: 'Get pembayaran by ID',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Detail pembayaran',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/Pembayaran' } },
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
  },
};
