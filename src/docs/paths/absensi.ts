import { commonResponses } from '../components';

export const absensiPaths = {
  '/absensi/masuk': {
    post: {
      tags: ['Absensi'],
      summary: 'Absen masuk (check-in)',
      description: 'Mencatat jam masuk hari ini untuk user login. Satu kali per hari (409 bila sudah). Semua role.',
      responses: {
        '201': { description: 'Absen masuk tercatat' },
        '401': commonResponses.Unauthorized,
        '409': { description: 'Sudah absen masuk hari ini' },
      },
    },
  },
  '/absensi/keluar': {
    post: {
      tags: ['Absensi'],
      summary: 'Absen keluar (check-out)',
      description: 'Mencatat jam keluar untuk record hari ini. 404 bila belum absen masuk, 409 bila sudah keluar. Semua role.',
      responses: {
        '200': { description: 'Absen keluar tercatat' },
        '401': commonResponses.Unauthorized,
        '404': commonResponses.NotFound,
        '409': { description: 'Sudah absen keluar hari ini' },
      },
    },
  },
  '/absensi': {
    get: {
      tags: ['Absensi'],
      summary: 'Rekap absensi',
      description: 'Untuk SPV → Absensi Karyawan. Filter `?date=YYYY-MM-DD`. Role: **admin, owner, supervisor**.',
      parameters: [{ name: 'date', in: 'query', schema: { type: 'string', example: '2026-07-09' } }],
      responses: {
        '200': {
          description: 'Daftar absensi',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  { nama: 'Kasir 1', tanggal: '2026-07-09', jamMasuk: '2026-07-09T05:32:02.000Z', jamKeluar: '2026-07-09T11:40:32.000Z' },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
      },
    },
  },
};
