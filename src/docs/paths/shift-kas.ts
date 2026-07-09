import { commonResponses } from '../components';

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer' },
};

const shiftExample = {
  success: true,
  data: {
    shiftId: 1,
    userId: 2,
    namaKasir: 'Kasir 1',
    kasAwal: 100000,
    status: 'open',
    waktuMulai: '2026-07-09T08:00:00.000Z',
    waktuSelesai: null,
    kasAkhir: null,
    tanggal: '2026-07-09',
    totalMasuk: 50000,
    totalKeluar: 20000,
    totalKas: 130000,
    entries: [
      {
        entryId: 2,
        jenis: 'penarikan',
        namaTransaksi: 'Beli galon',
        jumlah: 20000,
        catatan: 'air',
        waktu: '2026-07-09T09:10:00.000Z',
      },
    ],
  },
};

export const shiftKasPaths = {
  '/shift-kas/aktif': {
    get: {
      tags: ['Shift Kas'],
      summary: 'Shift aktif milik user login',
      description: 'Shift berstatus `open` milik user yang login (untuk restore state). `data: null` bila tidak ada. Role: **admin, kasir**.',
      responses: {
        '200': { description: 'Shift aktif / null', content: { 'application/json': { example: shiftExample } } },
        '401': commonResponses.Unauthorized,
      },
    },
  },
  '/shift-kas': {
    get: {
      tags: ['Shift Kas'],
      summary: 'Riwayat shift',
      description: 'Kasir hanya melihat shift miliknya; admin/owner/supervisor melihat semua. Filter `?date=YYYY-MM-DD`.',
      parameters: [{ name: 'date', in: 'query', schema: { type: 'string', example: '2026-07-09' } }],
      responses: {
        '200': { description: 'Daftar shift', content: { 'application/json': { example: { success: true, data: [shiftExample.data] } } } },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Shift Kas'],
      summary: 'Mulai shift',
      description: 'Mulai shift baru dengan kas awal. Ditolak (409) bila user masih punya shift `open`. Role: **admin, kasir**.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: { kasAwal: { type: 'integer', example: 100000 } } } } },
      },
      responses: {
        '201': { description: 'Shift dibuat', content: { 'application/json': { example: shiftExample } } },
        '409': { description: 'Masih ada shift aktif' },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/shift-kas/{id}/entry': {
    post: {
      tags: ['Shift Kas'],
      summary: 'Tambah setoran/penarikan',
      description: 'Tambah entri kas ke shift (shift harus `open` & milik user). Role: **admin, kasir**.',
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['jenis', 'namaTransaksi', 'jumlah'],
              properties: {
                jenis: { type: 'string', enum: ['setoran', 'penarikan'] },
                namaTransaksi: { type: 'string', example: 'Modal tambahan' },
                jumlah: { type: 'integer', example: 50000 },
                catatan: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Entri ditambah (mengembalikan shift + total terbaru)', content: { 'application/json': { example: shiftExample } } },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': { description: 'Shift sudah ditutup' },
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/shift-kas/{id}/tutup': {
    post: {
      tags: ['Shift Kas'],
      summary: 'Tutup shift',
      description: 'Menutup shift: hitung `kasAkhir` (= kas awal + Σsetoran − Σpenarikan), set waktu selesai & status `closed`. Role: **admin, kasir**.',
      parameters: [idParam],
      responses: {
        '200': { description: 'Shift ditutup', content: { 'application/json': { example: { ...shiftExample, data: { ...shiftExample.data, status: 'closed', kasAkhir: 130000, waktuSelesai: '2026-07-09T17:00:00.000Z' } } } } },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': { description: 'Shift sudah ditutup' },
      },
    },
  },
  '/shift-kas/entry/{id}': {
    patch: {
      tags: ['Shift Kas'],
      summary: 'Edit entri kas',
      description: 'Ubah `namaTransaksi`/`jumlah`/`catatan` (jenis tak berubah). Shift harus `open` & milik user. Role: **admin, kasir**.',
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: { namaTransaksi: { type: 'string' }, jumlah: { type: 'integer' }, catatan: { type: 'string' } } } } },
      },
      responses: {
        '200': { description: 'Entri diubah', content: { 'application/json': { example: shiftExample } } },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Shift Kas'],
      summary: 'Hapus entri kas',
      description: 'Hapus satu entri kas (shift harus `open` & milik user). Role: **admin, kasir**.',
      parameters: [idParam],
      responses: {
        '200': { description: 'Entri dihapus (mengembalikan shift + total terbaru)', content: { 'application/json': { example: shiftExample } } },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
  '/shift-kas/{id}': {
    get: {
      tags: ['Shift Kas'],
      summary: 'Detail shift',
      description: 'Detail satu shift + entri + total. Role: **admin, owner, kasir, supervisor**.',
      parameters: [idParam],
      responses: {
        '200': { description: 'Detail shift', content: { 'application/json': { example: shiftExample } } },
        '401': commonResponses.Unauthorized,
        '404': commonResponses.NotFound,
      },
    },
  },
};
