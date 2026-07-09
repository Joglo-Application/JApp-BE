import { commonResponses } from '../components';

export const logGudangPaths = {
  '/log-gudang': {
    get: {
      tags: ['Log Gudang'],
      summary: 'List audit log operasi gudang',
      description: 'Untuk halaman Owner → Log Gudang. Filter `?date=&jenis=`, terbaru dulu. Role: **admin, owner, gudang, supervisor**.',
      parameters: [
        { name: 'date', in: 'query', schema: { type: 'string', example: '2026-07-09' } },
        { name: 'jenis', in: 'query', schema: { type: 'string', example: 'UPDATE_Stok' } },
      ],
      responses: {
        '200': {
          description: 'Daftar log',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  { jenis: 'UPDATE_Stok', author: 'Gudang 1', logs: '1000 -> 100, Update Qty stok', tanggal: '2026-07-09', waktu: '2026-07-09T03:00:00.000Z' },
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
      tags: ['Log Gudang'],
      summary: 'Catat aksi gudang',
      description: 'Dipanggil FE saat user gudang melakukan aksi (tambah/edit/hapus bahan, ubah stok). `author` dari JWT; `waktu`/`tanggal` di-stamp server. Role: **admin, gudang**.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['jenis', 'logs'],
              properties: {
                jenis: { type: 'string', example: 'UPDATE_Stok' },
                logs: { type: 'string', example: '1000 -> 100, Update Qty stok' },
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
