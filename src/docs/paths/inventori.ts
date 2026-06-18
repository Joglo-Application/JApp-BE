import { commonResponses } from '../components';

export const inventoriPaths = {
  '/inventori': {
    get: {
      tags: ['Inventori'],
      summary: 'List stok produk (POS)',
      description: [
        'Stok level produk untuk halaman inventori POS (dari master `menus`).',
        'Isi `stok`/`stokMinimum`/`imageUrl` lewat `PATCH /menus/{id}`.',
      ].join('\n'),
      responses: {
        '200': {
          description: 'List inventori produk',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  {
                    id: 'INV-001',
                    nama: 'Kopi Susu',
                    kategori: 'minuman',
                    qtyStok: 50,
                    qtyTahan: 10,
                    imageUrl: null,
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
