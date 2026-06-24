import { commonResponses } from '../components';

export const kitchenPaths = {
  '/kitchen/orders': {
    get: {
      tags: ['Kitchen'],
      summary: 'List order aktif untuk dapur',
      description: [
        'Order aktif = pesanan berstatus `in_progress` (sedang diproses), diurutkan FIFO.',
        'Saat pesanan dibayar (status `completed`) otomatis hilang dari daftar ini.',
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
};
