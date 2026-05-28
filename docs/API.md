# POS API Documentation

Dokumentasi lengkap REST API untuk POS Backend.

- **Base URL (Development):** `http://localhost:3000/api/v1`
- **Authentication:** JWT Bearer Token
- **Content-Type:** `application/json`
- **Versi:** v1

---

## Table of Contents

- [Conventions](#conventions)
  - [Response Envelope](#response-envelope)
  - [Error Codes](#error-codes)
  - [Authentication](#authentication)
  - [Pagination](#pagination)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Users](#users)
  - [Bahan Baku](#bahan-baku)
  - [Suppliers](#suppliers)
  - [Menus](#menus)
  - [Resep Menu](#resep-menu)

---

## Conventions

### Response Envelope

Semua response API menggunakan envelope yang konsisten.

#### Success Response

```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": { /* optional, hanya untuk paginated response */ }
}
```

#### Paginated Response

```json
{
  "success": true,
  "data": [ /* array */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* optional, contoh: validation errors per-field */ }
  }
}
```

### Error Codes

| HTTP Status | Code | Deskripsi |
|---|---|---|
| 400 | `BAD_REQUEST` | Request tidak valid (format JSON salah, dll) |
| 401 | `UNAUTHORIZED` | Tidak ada token / token invalid / token expired |
| 403 | `FORBIDDEN` | Role tidak diizinkan akses endpoint ini |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 409 | `CONFLICT` | Konflik data (mis. username sudah dipakai) |
| 422 | `VALIDATION_ERROR` | Validasi input gagal (lihat `details`) |
| 500 | `INTERNAL_ERROR` | Server error |

### Authentication

Semua endpoint kecuali `/health`, `/auth/login` membutuhkan JWT token.

Sertakan di header:

```
Authorization: Bearer <jwt_token>
```

Token diperoleh dari endpoint [`POST /auth/login`](#post-authlogin). Default expire: **7 hari**.

### Role-Based Access

| Role | Akses |
|---|---|
| `admin` | Full access (semua endpoint) |
| `kasir` | Read master data, POS transaction (write pesanan & pembayaran) |
| `owner` | Read all data + laporan (TBD di Phase 8) |

### Pagination

Semua endpoint `list` mendukung pagination & search via query params:

| Param | Type | Default | Deskripsi |
|---|---|---|---|
| `page` | integer | `1` | Halaman (min 1) |
| `limit` | integer | `10` | Item per halaman (max 100) |
| `q` | string | - | Search keyword (opsional, case-insensitive) |

Contoh: `GET /menus?page=2&limit=5&q=kopi`

---

## Endpoints

## Health

### GET /health

Cek apakah server hidup. Tidak butuh autentikasi.

**Request:**
```http
GET /api/v1/health
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "pos-api",
    "env": "development",
    "timestamp": "2026-05-25T10:00:00.000Z"
  }
}
```

---

## Auth

### POST /auth/login

Login untuk mendapatkan JWT token.

**Auth:** ❌ Tidak perlu

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Validasi:**
- `username`: string, min 3, max 50
- `password`: string, min 6, max 100

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "namaUser": "Administrator",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**Response 401 (kredensial salah):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Username atau password salah"
  }
}
```

**Response 422 (validasi gagal):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fieldErrors": {
        "username": ["Username minimal 3 karakter"],
        "password": ["Password minimal 6 karakter"]
      }
    }
  }
}
```

---

### GET /auth/me

Get current user info (dari JWT token).

**Auth:** ✅ Bearer token

**Request:**
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "namaUser": "Administrator",
    "username": "admin",
    "role": "admin",
    "createdAt": "2026-05-22T07:42:21.421Z"
  }
}
```

**Response 401:**
- Token tidak ada / format salah → `Missing or invalid Authorization header`
- Token invalid / expired → `Invalid or expired token`

---

## Users

> 🔒 Semua endpoint **admin only**

### GET /users

List users dengan pagination.

**Auth:** ✅ Admin only

**Query Params:** Lihat [Pagination](#pagination)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 2,
      "namaUser": "Kasir 1",
      "username": "kasir1",
      "role": "kasir",
      "createdAt": "2026-05-22T07:42:21.542Z",
      "updatedAt": "2026-05-22T07:42:21.542Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
}
```

---

### GET /users/:id

Detail user.

**Auth:** ✅ Admin only

**Path Params:**
- `id` (integer) — user_id

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "namaUser": "Administrator",
    "username": "admin",
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Response 404:** `User tidak ditemukan`

---

### POST /users

Create user baru.

**Auth:** ✅ Admin only

**Request Body:**
```json
{
  "namaUser": "Kasir Baru",
  "username": "kasir2",
  "password": "kasir123",
  "role": "kasir"
}
```

**Validasi:**
- `namaUser`: string, required, max 100
- `username`: string, min 3, max 50, regex `/^[a-zA-Z0-9_]+$/`
- `password`: string, min 6, max 100
- `role`: enum `admin | kasir | owner` (default: `kasir`)

**Response 201:** User yang dibuat (tanpa password)

**Response 409:** `Username sudah terpakai`

---

### PATCH /users/:id

Update user (partial). Bisa update salah satu atau lebih field.

**Auth:** ✅ Admin only

**Request Body:** Semua field optional, minimal 1 harus ada.
```json
{
  "namaUser": "Nama Baru",
  "password": "passwordbaru"
}
```

**Response 200:** User setelah update

**Response 404 / 409:** Idem dengan POST

---

### DELETE /users/:id

Hapus user.

**Auth:** ✅ Admin only

**Response 200:**
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

## Bahan Baku

> 🔓 **Read:** semua role | 🔒 **Write:** admin only

### GET /bahan-baku

List bahan baku.

**Auth:** ✅ Any role

**Query Params:** Lihat [Pagination](#pagination). `q` filter berdasarkan `namaBahan`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "bahanId": 1,
      "namaBahan": "Kopi Bubuk",
      "satuan": "gram",
      "stok": "5000.000",
      "stokMinimum": "500.000",
      "hargaSatuan": 150,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

---

### GET /bahan-baku/:id

Detail bahan baku.

**Auth:** ✅ Any role

**Response 200:** Satu object bahan baku

**Response 404:** `Bahan baku tidak ditemukan`

---

### POST /bahan-baku

Create bahan baku.

**Auth:** ✅ Admin only

**Request Body:**
```json
{
  "namaBahan": "Coklat Bubuk",
  "satuan": "gram",
  "stok": "3000",
  "stokMinimum": "300",
  "hargaSatuan": 250
}
```

**Validasi:**
- `namaBahan`: string, required, max 100
- `satuan`: string, required, max 20
- `stok`: decimal string (e.g. `"100.5"`), default `"0"`
- `stokMinimum`: decimal string, default `"0"`
- `hargaSatuan`: integer ≥ 0, default `0`

**Response 201:** Bahan baku yang dibuat

---

### PATCH /bahan-baku/:id

Update bahan baku (partial).

**Auth:** ✅ Admin only

**Request Body:** Semua field optional, minimal 1.

**Response 200:** Bahan baku setelah update

---

### DELETE /bahan-baku/:id

Hapus bahan baku.

**Auth:** ✅ Admin only

**Catatan:** Akan **gagal** jika bahan masih dipakai di resep menu / transaksi (FK constraint).

---

## Suppliers

> 🔓 **Read:** semua role | 🔒 **Write:** admin only

### GET /suppliers

List supplier dengan pagination.

**Auth:** ✅ Any role

**Query Params:** Lihat [Pagination](#pagination). `q` filter berdasarkan `namaSupplier`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "supplierId": 1,
      "namaSupplier": "CV Sumber Rezeki",
      "noTelp": "081234567890",
      "alamat": "Jl. Pasar Baru No. 10, Jakarta",
      "email": "sumberrezeki@example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
}
```

---

### GET /suppliers/:id

Detail supplier.

**Response 404:** `Supplier tidak ditemukan`

---

### POST /suppliers

Create supplier.

**Auth:** ✅ Admin only

**Request Body:**
```json
{
  "namaSupplier": "PT Sumber Baru",
  "noTelp": "08123456789",
  "alamat": "Jl. Sudirman No. 1",
  "email": "sumber@example.com"
}
```

**Validasi:**
- `namaSupplier`: string, required, max 100
- `noTelp`: string, optional, max 20
- `alamat`: string, optional
- `email`: valid email, optional, max 100

**Response 201:** Supplier yang dibuat

---

### PATCH /suppliers/:id

Update supplier (partial).

**Auth:** ✅ Admin only

---

### DELETE /suppliers/:id

Hapus supplier.

**Auth:** ✅ Admin only

**Catatan:** Gagal jika ada PO / transaksi yang terkait.

---

## Menus

> 🔓 **Read:** semua role | 🔒 **Write:** admin only

### GET /menus

List menu.

**Auth:** ✅ Any role

**Query Params:** Lihat [Pagination](#pagination). `q` filter berdasarkan `namaMenu`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "menuId": 1,
      "namaMenu": "Kopi Susu",
      "kategori": "minuman",
      "harga": 18000,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 }
}
```

---

### GET /menus/:id

Detail menu **+ daftar resep** (include sub-resource).

**Auth:** ✅ Any role

**Response 200:**
```json
{
  "success": true,
  "data": {
    "menuId": 1,
    "namaMenu": "Kopi Susu",
    "kategori": "minuman",
    "harga": 18000,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "...",
    "resep": [
      {
        "resepId": 1,
        "bahanId": 1,
        "namaBahan": "Kopi Bubuk",
        "satuan": "gram",
        "jumlahPakai": "10.000"
      },
      {
        "resepId": 2,
        "bahanId": 2,
        "namaBahan": "Susu UHT",
        "satuan": "ml",
        "jumlahPakai": "100.000"
      }
    ]
  }
}
```

---

### POST /menus

Create menu.

**Auth:** ✅ Admin only

**Request Body:**
```json
{
  "namaMenu": "Coklat Panas",
  "kategori": "minuman",
  "harga": 16000,
  "isActive": true
}
```

**Validasi:**
- `namaMenu`: string, required, max 100
- `kategori`: string, required, max 50
- `harga`: integer ≥ 0
- `isActive`: boolean, default `true`

**Response 201:** Menu yang dibuat

---

### PATCH /menus/:id

Update menu (partial).

**Auth:** ✅ Admin only

**Request Body:** Semua field optional, minimal 1.
```json
{
  "harga": 17000,
  "isActive": false
}
```

---

### DELETE /menus/:id

Hapus menu. Resep menu otomatis ikut terhapus (cascade).

**Auth:** ✅ Admin only

**Catatan:** Gagal jika menu sudah pernah dipesan (FK restrict).

---

## Resep Menu

Sub-resource dari menu. Mendefinisikan komposisi bahan baku untuk satu menu.

### GET /menus/:id/resep

List resep dari menu tertentu.

**Auth:** ✅ Any role

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "resepId": 1,
      "menuId": 1,
      "bahanId": 1,
      "namaBahan": "Kopi Bubuk",
      "satuan": "gram",
      "jumlahPakai": "10.000"
    }
  ]
}
```

**Response 404:** `Menu tidak ditemukan`

---

### POST /menus/:id/resep

Tambah bahan ke resep menu.

**Auth:** ✅ Admin only

**Request Body:**
```json
{
  "bahanId": 4,
  "jumlahPakai": "50"
}
```

**Validasi:**
- `bahanId`: integer, required
- `jumlahPakai`: decimal string > 0 (max 3 desimal)

**Response 201:** Resep yang dibuat

**Response 404:** `Menu tidak ditemukan` atau `Bahan baku tidak ditemukan`

**Response 409:** `Bahan ini sudah ada di resep menu`

---

### PATCH /menus/:id/resep/:resepId

Update jumlah pakai bahan di resep.

**Auth:** ✅ Admin only

**Request Body:**
```json
{
  "jumlahPakai": "12"
}
```

**Response 200:** Resep setelah update

**Response 404:** `Resep tidak ditemukan`

---

### DELETE /menus/:id/resep/:resepId

Hapus bahan dari resep menu.

**Auth:** ✅ Admin only

**Response 200:**
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

## Default Credentials (Development)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Kasir | `kasir1` | `kasir123` |

---

## Versioning & Compatibility

- API saat ini di **v1** (mounted di `/api/v1`)
- Breaking changes akan rilis sebagai `v2` (mounted di `/api/v2`)
- v1 akan tetap maintained minimal 6 bulan setelah v2 rilis

---

## Endpoint Roadmap (Belum Tersedia)

Endpoint berikut akan ditambahkan di phase mendatang:

### Phase 6 — POS Core
- `POST /pesanan` — buat pesanan
- `GET /pesanan` — list pesanan
- `PATCH /pesanan/:id/status` — update status (auto-deduct stok via resep)
- `POST /pembayaran` — catat pembayaran

### Phase 7 — Inventory
- `POST /pesanan-bahan` — buat PO ke supplier
- `POST /transaksi/masuk` — terima bahan
- `POST /transaksi/keluar` — pengeluaran manual (waste, dll)

### Phase 8 — Laporan
- `GET /laporan/pemasukan?from=&to=`
- `GET /laporan/pengeluaran?from=&to=`
- `GET /laporan/laba-rugi?from=&to=`
- `GET /laporan/stok-rendah`
- `GET /laporan/menu-terlaris`

---

**Last updated:** Phase 5 — Master Data Modules
