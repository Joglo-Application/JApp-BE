import { commonResponses, idPathParam } from '../components';

export const pesananPaths = {
  '/pesanan': {
    get: {
      tags: ['Pesanan'],
      summary: 'List pesanan',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
        },
        {
          name: 'mejaId',
          in: 'query',
          description: 'Filter pesanan milik suatu meja (mis. untuk "Lihat Pesanan").',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        '200': {
          description: 'List pesanan',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Pesanan'],
      summary: 'Create pesanan (POS sale)',
      description:
        '**Admin & Kasir.** Membuat pesanan baru. Total dihitung dari harga menu, ' +
        'stok bahan baku dipotong otomatis berdasarkan resep menu, dan transaksi bahan ' +
        'keluar (tipe `sale`) dicatat. Semuanya atomik dalam satu transaksi DB.\n\n' +
        '⚠️ Pesanan **dine_in wajib menyertakan `mejaId`** (jika tidak → 422).\n\n' +
        '💡 Kirim `hold: true` untuk menyimpan sebagai **draft (status `pending`)**: ' +
        'tidak memotong stok, tidak masuk dapur, validasi metode/meja di-relax. ' +
        'Dipakai fitur "Pending" (parkir cart).',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreatePesananInput' } },
        },
      },
      responses: {
        '201': {
          description: 'Pesanan dibuat',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/PesananDetail' } },
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
  '/pesanan/{id}': {
    get: {
      tags: ['Pesanan'],
      summary: 'Get pesanan by ID',
      description: 'Mengembalikan pesanan beserta item dan pembayaran (jika ada).',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Detail pesanan',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/PesananDetail' } },
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
    delete: {
      tags: ['Pesanan'],
      summary: 'Hapus draft (pending)',
      description:
        '**Admin & Kasir.** Menghapus pesanan **draft (status `pending`)** — dipakai saat draft ' +
        'di-Pilih/Gabung kembali ke POS. Hanya status `pending` yang boleh dihapus ' +
        '(in_progress/completed/cancelled → 400).',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Draft dihapus',
          content: {
            'application/json': { example: { success: true, data: { deleted: true } } },
          },
        },
        '400': {
          description: 'Pesanan bukan draft (pending)',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
  '/pesanan/{id}/cancel': {
    post: {
      tags: ['Pesanan'],
      summary: 'Cancel pesanan',
      description:
        '**Admin & Kasir.** Membatalkan pesanan yang masih `pending` dan mengembalikan ' +
        'stok bahan baku yang sebelumnya dipotong (dicatat sebagai `adjustment`).',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Pesanan dibatalkan',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/Pesanan' } },
                  },
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
