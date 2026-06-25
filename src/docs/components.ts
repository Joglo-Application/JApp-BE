// Reusable OpenAPI schemas, parameters, and responses.
// Tambah/edit di sini kalau ada perubahan struktur global.

export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token dari endpoint POST /auth/login',
  },
} as const;

export const commonResponses = {
  Unauthorized: {
    description: 'Token tidak ada / invalid / expired',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
        },
      },
    },
  },
  Forbidden: {
    description: 'Role tidak diizinkan akses endpoint ini',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied. Required role: admin' },
        },
      },
    },
  },
  NotFound: {
    description: 'Resource tidak ditemukan',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource tidak ditemukan' },
        },
      },
    },
  },
  ValidationError: {
    description: 'Validasi input gagal',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: {
              formErrors: [],
              fieldErrors: { fieldName: ['error message'] },
            },
          },
        },
      },
    },
  },
  Conflict: {
    description: 'Konflik data',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: { code: 'CONFLICT', message: 'Resource conflict' },
        },
      },
    },
  },
} as const;

export const paginationParams = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
    description: 'Nomor halaman',
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    description: 'Item per halaman',
  },
  {
    name: 'q',
    in: 'query',
    schema: { type: 'string' },
    description: 'Search keyword (case-insensitive)',
  },
] as const;

export const idPathParam = {
  name: 'id',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' },
  description: 'Resource ID',
};

export const schemas = {
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { type: 'object' },
      meta: { type: 'object' },
    },
    required: ['success', 'data'],
  },
  PaginatedResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { type: 'array', items: { type: 'object' } },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 25 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string' },
          details: { type: 'object', nullable: true },
        },
        required: ['code', 'message'],
      },
    },
    required: ['success', 'error'],
  },

  // Entity schemas
  User: {
    type: 'object',
    properties: {
      userId: { type: 'integer', example: 1 },
      namaUser: { type: 'string', example: 'Administrator' },
      username: { type: 'string', example: 'admin' },
      role: { type: 'string', enum: ['admin', 'kasir', 'owner'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateUserInput: {
    type: 'object',
    required: ['namaUser', 'username', 'password'],
    properties: {
      namaUser: { type: 'string', maxLength: 100, example: 'Kasir Baru' },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_]+$',
        example: 'kasir2',
      },
      password: { type: 'string', minLength: 6, maxLength: 100, example: 'kasir123' },
      role: { type: 'string', enum: ['admin', 'kasir', 'owner'], default: 'kasir' },
    },
  },
  UpdateUserInput: {
    type: 'object',
    description: 'Minimal satu field harus diisi',
    properties: {
      namaUser: { type: 'string', maxLength: 100 },
      username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
      password: { type: 'string', minLength: 6, maxLength: 100 },
      role: { type: 'string', enum: ['admin', 'kasir', 'owner'] },
    },
  },

  BahanBaku: {
    type: 'object',
    properties: {
      bahanId: { type: 'integer', example: 1 },
      namaBahan: { type: 'string', example: 'Kopi Bubuk' },
      satuan: { type: 'string', example: 'gram' },
      stok: { type: 'string', example: '5000.000', description: 'Decimal string' },
      stokMinimum: { type: 'string', example: '500.000' },
      hargaSatuan: { type: 'integer', example: 150 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateBahanBakuInput: {
    type: 'object',
    required: ['namaBahan', 'satuan'],
    properties: {
      namaBahan: { type: 'string', maxLength: 100, example: 'Coklat Bubuk' },
      satuan: { type: 'string', maxLength: 20, example: 'gram' },
      stok: { type: 'string', example: '3000', description: 'Decimal string (max 3 desimal)' },
      stokMinimum: { type: 'string', example: '300' },
      hargaSatuan: { type: 'integer', minimum: 0, example: 250 },
    },
  },
  UpdateBahanBakuInput: {
    type: 'object',
    description: 'Minimal satu field harus diisi',
    properties: {
      namaBahan: { type: 'string', maxLength: 100 },
      satuan: { type: 'string', maxLength: 20 },
      stok: { type: 'string' },
      stokMinimum: { type: 'string' },
      hargaSatuan: { type: 'integer', minimum: 0 },
    },
  },

  Supplier: {
    type: 'object',
    properties: {
      supplierId: { type: 'integer', example: 1 },
      namaSupplier: { type: 'string', example: 'CV Sumber Rezeki' },
      noTelp: { type: 'string', nullable: true, example: '081234567890' },
      alamat: { type: 'string', nullable: true, example: 'Jl. Pasar Baru No. 10' },
      email: { type: 'string', format: 'email', nullable: true, example: 'sumber@example.com' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateSupplierInput: {
    type: 'object',
    required: ['namaSupplier'],
    properties: {
      namaSupplier: { type: 'string', maxLength: 100, example: 'PT Sumber Baru' },
      noTelp: { type: 'string', maxLength: 20, nullable: true, example: '08123456789' },
      alamat: { type: 'string', nullable: true, example: 'Jl. Sudirman No. 1' },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 100,
        nullable: true,
        example: 'sumber@example.com',
      },
    },
  },
  UpdateSupplierInput: {
    type: 'object',
    properties: {
      namaSupplier: { type: 'string', maxLength: 100 },
      noTelp: { type: 'string', maxLength: 20, nullable: true },
      alamat: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email', maxLength: 100, nullable: true },
    },
  },

  Menu: {
    type: 'object',
    properties: {
      menuId: { type: 'integer', example: 1 },
      namaMenu: { type: 'string', example: 'Kopi Susu' },
      kategori: { type: 'string', example: 'minuman' },
      harga: { type: 'integer', example: 18000 },
      isActive: { type: 'boolean', example: true },
      stok: { type: 'integer', example: 10 },
      stokMinimum: { type: 'integer', example: 3 },
      imageUrl: { type: 'string', nullable: true },
      royaltyPoint: { type: 'integer', nullable: true, example: 5 },
      isProdukKhusus: { type: 'boolean', example: false },
      produkKhususMulai: { type: 'string', format: 'date', nullable: true },
      produkKhususSelesai: { type: 'string', format: 'date', nullable: true },
      catatan: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  MenuWithResep: {
    allOf: [
      { $ref: '#/components/schemas/Menu' },
      {
        type: 'object',
        properties: {
          resep: {
            type: 'array',
            items: { $ref: '#/components/schemas/ResepItem' },
          },
        },
      },
    ],
  },
  CreateMenuInput: {
    type: 'object',
    required: ['namaMenu', 'kategori', 'harga'],
    properties: {
      namaMenu: { type: 'string', maxLength: 100, example: 'Coklat Panas' },
      kategori: { type: 'string', maxLength: 50, example: 'minuman' },
      harga: { type: 'integer', minimum: 0, example: 16000 },
      isActive: { type: 'boolean', default: true },
      stok: { type: 'integer', minimum: 0, default: 0, description: 'Stok awal (lacak inventori)' },
      stokMinimum: { type: 'integer', minimum: 0, default: 0, description: 'Peringatan sisa stok' },
      resep: {
        type: 'array',
        description: 'Resep makanan opsional — dibuat sekaligus dengan menu.',
        items: {
          type: 'object',
          required: ['bahanId', 'jumlahPakai'],
          properties: {
            bahanId: { type: 'integer', example: 1 },
            jumlahPakai: {
              type: 'string',
              example: '10',
              description: 'Decimal string (max 3 desimal)',
            },
          },
        },
      },
      royaltyPoint: {
        type: 'integer',
        minimum: 0,
        nullable: true,
        description: 'Royalty point opsional',
      },
      isProdukKhusus: {
        type: 'boolean',
        default: false,
        description: 'Bila true, wajib sertakan produkKhususMulai & produkKhususSelesai',
      },
      produkKhususMulai: { type: 'string', format: 'date', example: '2026-07-01', nullable: true },
      produkKhususSelesai: {
        type: 'string',
        format: 'date',
        example: '2026-07-31',
        nullable: true,
      },
      catatan: { type: 'string', maxLength: 500, nullable: true },
    },
  },
  UpdateMenuInput: {
    type: 'object',
    properties: {
      namaMenu: { type: 'string', maxLength: 100 },
      kategori: { type: 'string', maxLength: 50 },
      harga: { type: 'integer', minimum: 0 },
      isActive: { type: 'boolean' },
    },
  },

  ResepItem: {
    type: 'object',
    properties: {
      resepId: { type: 'integer', example: 1 },
      menuId: { type: 'integer', example: 1 },
      bahanId: { type: 'integer', example: 1 },
      namaBahan: { type: 'string', example: 'Kopi Bubuk' },
      satuan: { type: 'string', example: 'gram' },
      jumlahPakai: { type: 'string', example: '10.000' },
    },
  },
  CreateResepInput: {
    type: 'object',
    required: ['bahanId', 'jumlahPakai'],
    properties: {
      bahanId: { type: 'integer', example: 4 },
      jumlahPakai: {
        type: 'string',
        example: '50',
        description: 'Decimal positive (max 3 desimal)',
      },
    },
  },
  UpdateResepInput: {
    type: 'object',
    required: ['jumlahPakai'],
    properties: {
      jumlahPakai: { type: 'string', example: '12' },
    },
  },

  // Auth schemas
  LoginInput: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50, example: 'admin' },
      password: { type: 'string', minLength: 6, maxLength: 100, example: 'admin123' },
    },
  },
  LoginResponse: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'JWT bearer token' },
      user: { $ref: '#/components/schemas/User' },
    },
  },

  // Pesanan schemas
  PesananItem: {
    type: 'object',
    properties: {
      detailId: { type: 'integer', example: 1 },
      menuId: { type: 'integer', nullable: true, example: 1 },
      namaCustom: { type: 'string', nullable: true, example: null },
      namaMenu: { type: 'string', nullable: true, example: 'Kopi Susu' },
      jumlah: { type: 'integer', example: 2 },
      hargaSatuan: { type: 'integer', example: 18000 },
      diskon: { type: 'integer', example: 0 },
      subtotal: { type: 'integer', example: 36000 },
      catatan: { type: 'string', nullable: true, example: 'tanpa gula' },
    },
  },
  Pesanan: {
    type: 'object',
    properties: {
      pesananId: { type: 'integer', example: 1 },
      tanggal: { type: 'string', format: 'date', example: '2026-06-03' },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        example: 'in_progress',
      },
      subtotal: { type: 'integer', example: 36000 },
      serviceCharge: { type: 'integer', example: 1800, description: 'Biaya layanan (default 5%)' },
      pajak: { type: 'integer', example: 1800, description: 'PPN (default 5%)' },
      diskon: { type: 'integer', example: 0 },
      diskonTipe: { type: 'string', nullable: true, enum: ['amount', 'percent', null] },
      promoNama: { type: 'string', nullable: true, example: null },
      total: {
        type: 'integer',
        example: 39600,
        description: 'subtotal + layanan + pajak − diskon',
      },
      orderType: {
        type: 'string',
        nullable: true,
        enum: ['dine_in', 'take_away', 'gofood', 'grabfood', 'shopeefood', null],
        example: 'dine_in',
      },
      customerNama: { type: 'string', nullable: true, example: 'Budi' },
      catatan: { type: 'string', nullable: true, example: null },
      mejaId: { type: 'integer', nullable: true, example: 3 },
      memberId: { type: 'integer', nullable: true, example: null },
      userId: { type: 'integer', example: 1 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  PesananDetail: {
    allOf: [
      { $ref: '#/components/schemas/Pesanan' },
      {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/PesananItem' } },
          pembayaran: {
            oneOf: [{ $ref: '#/components/schemas/Pembayaran' }, { type: 'null' }],
          },
        },
      },
    ],
  },
  CreatePesananInput: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        minItems: 1,
        description:
          'Item menu (pakai menuId) atau item custom (namaCustom + hargaSatuan). Total & stok dihitung server-side.',
        items: {
          type: 'object',
          required: ['jumlah'],
          properties: {
            menuId: { type: 'integer', example: 1, description: 'Wajib untuk item menu' },
            namaCustom: {
              type: 'string',
              example: 'Es Teh Spesial',
              description: 'Untuk item custom',
            },
            hargaSatuan: { type: 'integer', example: 8000, description: 'Wajib untuk item custom' },
            jumlah: { type: 'integer', minimum: 1, example: 2 },
            diskon: {
              type: 'integer',
              minimum: 0,
              example: 0,
              description: 'Diskon nominal per baris',
            },
            catatan: { type: 'string', example: 'tanpa gula' },
          },
        },
      },
      customerNama: { type: 'string', example: 'Budi' },
      orderType: {
        type: 'string',
        enum: ['dine_in', 'take_away', 'gofood', 'grabfood', 'shopeefood'],
        example: 'dine_in',
      },
      catatan: { type: 'string', example: 'meja pojok' },
      mejaId: { type: 'integer', example: 3 },
      memberId: { type: 'integer', example: 1 },
      hold: {
        type: 'boolean',
        default: false,
        description:
          'true = simpan sebagai draft (status pending): tanpa potong stok, tanpa masuk dapur.',
      },
      diskon: {
        type: 'object',
        description: 'Diskon level pesanan',
        properties: {
          tipe: { type: 'string', enum: ['amount', 'percent'], example: 'percent' },
          nilai: { type: 'number', example: 10 },
          promoNama: { type: 'string', example: 'OPENING' },
        },
      },
    },
  },

  // Pembayaran schemas
  Pembayaran: {
    type: 'object',
    properties: {
      pembayaranId: { type: 'integer', example: 1 },
      tanggal: { type: 'string', format: 'date', example: '2026-06-03' },
      metode: {
        type: 'string',
        enum: ['cash', 'qris', 'debit', 'transfer', 'qris_netzme'],
        example: 'cash',
      },
      jumlahBayar: { type: 'integer', example: 50000 },
      kembalian: { type: 'integer', example: 14000 },
      pesananId: { type: 'integer', example: 1 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreatePembayaranInput: {
    type: 'object',
    required: ['pesananId', 'metode', 'jumlahBayar'],
    properties: {
      pesananId: { type: 'integer', example: 1 },
      metode: {
        type: 'string',
        enum: ['cash', 'qris', 'debit', 'transfer', 'qris_netzme'],
        example: 'cash',
      },
      jumlahBayar: {
        type: 'integer',
        minimum: 0,
        example: 50000,
        description: 'Harus >= total pesanan. Kembalian dihitung otomatis.',
      },
    },
  },

  // Purchase Order (Pesanan Bahan) schemas
  PesananBahan: {
    type: 'object',
    properties: {
      pesananBahanId: { type: 'integer', example: 1 },
      tanggal: { type: 'string', format: 'date', example: '2026-06-09' },
      jumlah: { type: 'string', example: '50.000' },
      status: {
        type: 'string',
        enum: ['pending', 'received', 'cancelled'],
        example: 'pending',
      },
      bahanId: { type: 'integer', example: 1 },
      namaBahan: { type: 'string', example: 'Kopi Bubuk' },
      satuan: { type: 'string', example: 'gram' },
      supplierId: { type: 'integer', example: 1 },
      namaSupplier: { type: 'string', example: 'CV Sumber Kopi' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreatePesananBahanInput: {
    type: 'object',
    required: ['bahanId', 'supplierId', 'jumlah'],
    properties: {
      bahanId: { type: 'integer', example: 1 },
      supplierId: { type: 'integer', example: 1 },
      jumlah: { type: 'string', example: '50', description: 'Decimal positif (max 3 desimal)' },
    },
  },
  ReceivePesananBahanInput: {
    type: 'object',
    required: ['hargaSatuan'],
    properties: {
      hargaSatuan: {
        type: 'integer',
        minimum: 0,
        example: 150,
        description: 'Harga beli per satuan',
      },
      jumlah: {
        type: 'string',
        example: '50',
        description: 'Opsional. Jika kosong, pakai jumlah PO. Decimal positif.',
      },
    },
  },

  // Transaksi Bahan Masuk schemas
  TransaksiMasuk: {
    type: 'object',
    properties: {
      transaksiMasukId: { type: 'integer', example: 1 },
      tanggal: { type: 'string', format: 'date', example: '2026-06-09' },
      jumlah: { type: 'string', example: '50.000' },
      hargaSatuan: { type: 'integer', example: 150 },
      subtotal: { type: 'integer', example: 7500 },
      pesananBahanId: { type: 'integer', nullable: true, example: 1 },
      bahanId: { type: 'integer', example: 1 },
      namaBahan: { type: 'string', example: 'Kopi Bubuk' },
      satuan: { type: 'string', example: 'gram' },
      supplierId: { type: 'integer', example: 1 },
      namaSupplier: { type: 'string', example: 'CV Sumber Kopi' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateTransaksiMasukInput: {
    type: 'object',
    required: ['bahanId', 'supplierId', 'jumlah', 'hargaSatuan'],
    properties: {
      bahanId: { type: 'integer', example: 1 },
      supplierId: { type: 'integer', example: 1 },
      jumlah: { type: 'string', example: '50', description: 'Decimal positif (max 3 desimal)' },
      hargaSatuan: { type: 'integer', minimum: 0, example: 150 },
    },
  },

  // Transaksi Bahan Keluar schemas
  TransaksiKeluar: {
    type: 'object',
    properties: {
      transaksiKeluarId: { type: 'integer', example: 1 },
      tanggal: { type: 'string', format: 'date', example: '2026-06-09' },
      jumlah: { type: 'string', example: '10.000' },
      tipeKeluar: {
        type: 'string',
        enum: ['sale', 'waste', 'damaged', 'expired', 'adjustment'],
        example: 'waste',
      },
      keterangan: { type: 'string', nullable: true, example: 'Tumpah saat penyimpanan' },
      bahanId: { type: 'integer', example: 1 },
      namaBahan: { type: 'string', example: 'Kopi Bubuk' },
      satuan: { type: 'string', example: 'gram' },
      pesananId: { type: 'integer', nullable: true, example: null },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateTransaksiKeluarInput: {
    type: 'object',
    required: ['bahanId', 'jumlah', 'tipeKeluar'],
    properties: {
      bahanId: { type: 'integer', example: 1 },
      jumlah: { type: 'string', example: '10', description: 'Decimal positif (max 3 desimal)' },
      tipeKeluar: {
        type: 'string',
        enum: ['waste', 'damaged', 'expired', 'adjustment'],
        description: '`sale` tidak diperbolehkan (hanya dari penjualan otomatis)',
        example: 'waste',
      },
      keterangan: { type: 'string', maxLength: 500, example: 'Tumpah saat penyimpanan' },
    },
  },

  // Meja schemas
  Meja: {
    type: 'object',
    properties: {
      mejaId: { type: 'integer', example: 1 },
      nomor: { type: 'string', example: 'A1' },
      zona: { type: 'string', nullable: true, example: 'Indoor' },
      kapasitas: { type: 'integer', example: 4 },
      status: {
        type: 'string',
        enum: ['available', 'occupied', 'reserved', 'blocked'],
        example: 'available',
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateMejaInput: {
    type: 'object',
    required: ['nomor'],
    properties: {
      nomor: { type: 'string', maxLength: 30, example: 'A1' },
      zona: { type: 'string', maxLength: 50, example: 'Indoor' },
      kapasitas: { type: 'integer', minimum: 1, default: 4, example: 4 },
      status: {
        type: 'string',
        enum: ['available', 'occupied', 'reserved', 'blocked'],
        default: 'available',
      },
    },
  },
  UpdateMejaStatusInput: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['available', 'occupied', 'reserved', 'blocked'],
        example: 'occupied',
      },
    },
  },

  // Member schemas
  Member: {
    type: 'object',
    properties: {
      memberId: { type: 'integer', example: 1 },
      nama: { type: 'string', example: 'Siti Aminah' },
      noTelp: { type: 'string', nullable: true, example: '081234567890' },
      email: { type: 'string', nullable: true, example: 'siti@mail.com' },
      poin: { type: 'integer', example: 120 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  MemberDetail: {
    allOf: [
      { $ref: '#/components/schemas/Member' },
      {
        type: 'object',
        properties: {
          riwayatPoin: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                poinLogId: { type: 'integer' },
                tanggal: { type: 'string', format: 'date' },
                tipe: { type: 'string', enum: ['earn', 'redeem', 'adjustment'] },
                poin: { type: 'integer' },
                pesananId: { type: 'integer', nullable: true },
              },
            },
          },
        },
      },
    ],
  },
  CreateMemberInput: {
    type: 'object',
    required: ['nama'],
    properties: {
      nama: { type: 'string', maxLength: 100, example: 'Siti Aminah' },
      noTelp: { type: 'string', example: '081234567890' },
      email: { type: 'string', format: 'email', example: 'siti@mail.com' },
    },
  },
  AdjustPoinInput: {
    type: 'object',
    required: ['tipe', 'poin'],
    properties: {
      tipe: { type: 'string', enum: ['earn', 'redeem', 'adjustment'], example: 'earn' },
      poin: { type: 'integer', minimum: 1, example: 10 },
      pesananId: { type: 'integer', example: 1, description: 'Opsional, kaitkan ke pesanan' },
    },
  },
};
