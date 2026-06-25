import { commonResponses } from '../components';

export const kitchenPaths = {
  '/kitchen/orders': {
    get: {
      tags: ['Kitchen'],
      summary: 'List order aktif untuk dapur',
      description: [
        'Order aktif = pesanan berstatus `in_progress` (sedang diproses), diurutkan FIFO.',
        'Dine-In hilang dari daftar saat **dibayar** (status `completed`).',
        'Non Dine-In (take-away/online) tetap tampil setelah dibayar dan baru hilang saat dapur menekan **Selesai** (`PATCH /kitchen/orders/{id}/done`).',
        'Bentuk cocok dengan `KitchenOrderModel.fromJson` di FE.',
      ].join('\n'),
      responses: {
        '200': {
          description: 'Daftar order aktif untuk dapur',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  {
                    id: '11',
                    kodeTransaksi: 'TRX-0011',
                    tipe: 'DINE-IN',
                    startTime: '2026-06-18T12:34:41.355Z',
                    items: [
                      { nama: 'Kopi Susu', qty: 2, catatan: '' },
                      { nama: 'Burger Sapi', qty: 1, catatan: 'Pedas' },
                    ],
                  },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
      },
    },
  },
  '/kitchen/orders/{id}/done': {
    patch: {
      tags: ['Kitchen'],
      summary: 'Dapur menyelesaikan pesanan (non Dine-In)',
      description: [
        'Menandai pesanan `completed` sehingga hilang dari layar dapur.',
        'Hanya untuk order **non Dine-In**: Dine-In diselesaikan lewat pembayaran.',
        'Role: `admin`, `dapur`.',
      ].join('\n'),
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'ID pesanan',
        },
      ],
      responses: {
        '200': {
          description: 'Pesanan diselesaikan',
          content: {
            'application/json': {
              example: { success: true, data: { id: 15, status: 'completed' } },
            },
          },
        },
        '400': {
          description: 'ID tidak valid atau pesanan Dine-In (diselesaikan lewat pembayaran)',
          content: {
            'application/json': {
              example: {
                success: false,
                error: {
                  message: 'Pesanan Dine-In diselesaikan lewat pembayaran, bukan dari dapur',
                },
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': {
          description: 'Pesanan tidak berstatus in_progress',
          content: {
            'application/json': {
              example: {
                success: false,
                error: { message: 'Pesanan dengan status "completed" tidak dapat diselesaikan' },
              },
            },
          },
        },
      },
    },
  },
};
