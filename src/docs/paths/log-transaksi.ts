import { commonResponses } from '../components';

const TIPE_ENUM = [
  'ADD_QTY', 'REDUCE_QTY', 'UPDATE_PRICE', 'DISC_PCT_ITEM', 'DISC_AMT_ITEM',
  'DISC_PCT', 'DISC_AMT', 'DISC_VOUCHER', 'DISC_VOUCHER_PCT_ITEM',
  'DISC_VOUCHER_AMT_ITEM', 'VOID_ORDER', 'VOID_ITEM', 'VOID_ADDON',
  'FULL_REFUND', 'PARTIAL_REFUND', 'SPLIT_ORDER', 'APPLY_TAX', 'APPLY_SVC_CHARGE',
  'REMOVE_TAX', 'REMOVE_SVC_CHARGE', 'UPDATE_PAYMENT', 'SEND_KITCHEN', 'PRINT_CHECK',
];

export const logTransaksiPaths = {
  '/log-transaksi': {
    get: {
      tags: ['Log Transaksi'],
      summary: 'List audit log aksi POS',
      description: [
        'Untuk panel Laporan → Log Transaksi. Filter per tanggal & tipe, terbaru dulu.',
        'Bentuk cocok dengan `LogTransaksiEntry` di FE. Role: **admin, owner, kasir**.',
      ].join('\n'),
      parameters: [
        {
          name: 'date',
          in: 'query',
          schema: { type: 'string', example: '2026-07-06' },
          description: 'Filter tanggal (YYYY-MM-DD)',
        },
        {
          name: 'tipe',
          in: 'query',
          schema: { type: 'string', enum: TIPE_ENUM },
          description: 'Filter jenis aksi',
        },
      ],
      responses: {
        '200': {
          description: 'Daftar log',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  {
                    tipe: 'ADD_QTY',
                    kodeTransaksi: 'SES-001',
                    namaKasir: 'Kasir 1',
                    deskripsi: '1 -> 3, 2x Nasi Padang | Update jumlah item',
                    waktu: '2026-07-06T07:37:00.000Z',
                  },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
      },
    },
    post: {
      tags: ['Log Transaksi'],
      summary: 'Catat satu aksi POS',
      description: [
        'Dipanggil real-time tiap kasir melakukan aksi di POS. `userId`/`namaKasir`',
        'diisi dari JWT; `waktu`/`tanggal` di-stamp server. Role: **admin, kasir**.',
      ].join('\n'),
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tipe', 'kodeTransaksi', 'deskripsi'],
              properties: {
                tipe: { type: 'string', enum: TIPE_ENUM },
                kodeTransaksi: {
                  type: 'string',
                  example: 'SES-001',
                  description: 'Kode sesi order dari FE (bukan FK pesanan)',
                },
                deskripsi: {
                  type: 'string',
                  example: '1 -> 3, 2x Nasi Padang | Update jumlah item',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Log tercatat' },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '422': commonResponses.ValidationError,
      },
    },
  },
};
