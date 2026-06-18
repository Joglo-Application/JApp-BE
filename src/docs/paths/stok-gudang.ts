import { commonResponses } from '../components';

export const stokGudangPaths = {
  '/stok-gudang': {
    get: {
      tags: ['Stok Gudang'],
      summary: 'List stok gudang (bahan baku)',
      description: [
        'Stok bahan baku untuk dashboard owner (dari master `bahan_baku`).',
        'Status (aman/rendah/habis) dihitung di frontend dari `qtyStok` vs `qtyTahan`.',
        'Isi `kategori`/`imageUrl` lewat `PATCH /bahan-baku/{id}`.',
      ].join('\n'),
      responses: {
        '200': {
          description: 'List stok gudang',
          content: {
            'application/json': {
              example: {
                success: true,
                data: [
                  {
                    id: 'STK-001',
                    nama: 'Kopi Bubuk',
                    kategori: 'Bahan Kering',
                    unitProduk: 'gram',
                    qtyStok: 4920,
                    qtyTahan: 500,
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
