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
      username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$', example: 'kasir2' },
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
      email: { type: 'string', format: 'email', maxLength: 100, nullable: true, example: 'sumber@example.com' },
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
      jumlahPakai: { type: 'string', example: '50', description: 'Decimal positive (max 3 desimal)' },
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
      menuId: { type: 'integer', example: 1 },
      namaMenu: { type: 'string', example: 'Kopi Susu' },
      jumlah: { type: 'integer', example: 2 },
      hargaSatuan: { type: 'integer', example: 18000 },
      subtotal: { type: 'integer', example: 36000 },
    },
  },
  Pesanan: {
    type: 'object',
    properties: {
      pesananId: { type: 'integer', example: 1 },
      tanggal: { type: 'string', format: 'date', example: '2026-06-03' },
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'cancelled'],
        example: 'pending',
      },
      total: { type: 'integer', example: 36000 },
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
        description: 'Daftar item pesanan. Total & stok dihitung server-side dari resep menu.',
        items: {
          type: 'object',
          required: ['menuId', 'jumlah'],
          properties: {
            menuId: { type: 'integer', example: 1 },
            jumlah: { type: 'integer', minimum: 1, example: 2 },
          },
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
        enum: ['cash', 'qris', 'debit', 'transfer'],
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
        enum: ['cash', 'qris', 'debit', 'transfer'],
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
};
