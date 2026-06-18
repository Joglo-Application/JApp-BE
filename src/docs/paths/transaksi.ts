import { commonResponses } from '../components';

export const transaksiPaths = {
  '/transaksi': {
    get: {
      tags: ['Transaksi'],
      summary: 'List transaksi (riwayat penjualan)',
      description: [
        'Riwayat transaksi penjualan yang **sudah dibayar** pada satu tanggal.',
        'Menggabungkan pesanan + pembayaran + detail + staff + member, lalu',
        'dipetakan ke field yang dipakai frontend.',
        '',
        'Default tanggal = **hari ini** bila `date` tidak dikirim.',
      ].join('\n'),
      parameters: [
        {
          name: 'date',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'date', example: '2026-06-18' },
          description: 'Filter tanggal (YYYY-MM-DD). Default: hari ini.',
        },
      ],
      responses: {
        '200': {
          description: 'List transaksi pada tanggal tersebut',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  {
                    kodeTransaksi: 'TRX-0001',
                    waktu: '2026-06-18T12:34:41.355Z',
                    namaStaff: 'Administrator',
                    namaKontak: 'Budi',
                    tipePembayaran: 'TUNAI',
                    nominalPembayaran: 45200,
                    subtotal: 32000,
                    biayaLayananPct: 5,
                    biayaLayanan: 1600,
                    pajakTokoPct: 5,
                    pajakToko: 1600,
                    items: [
                      { nama: 'Coklat Panas', hargaSatuan: 16000, qty: 2, total: 32000 },
                    ],
                    total: 35200,
                  },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '422': commonResponses.ValidationError,
      },
    },
  },
};
