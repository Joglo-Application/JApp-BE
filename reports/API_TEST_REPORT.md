# POS API Test Report

Tanggal test: 2026-05-28 UTC
Base URL: `http://localhost:3000/api/v1`
Tool: Newman `6.2.2`
Collection: `backend/postman/pos-api.postman_collection.json`
Environment: `backend/postman/pos-api.postman_environment.json`

## Ringkasan Functional Test

- Iterasi: 1
- Total request: 28
- Request gagal menurut Newman: 0
- Assertion: 1
- Assertion gagal: 0
- Rata-rata response time: 16 ms
- Min / Max: 3 ms / 133 ms
- Durasi total: 786 ms
- Hasil JSON: `backend/reports/newman-pos-api.json`

Catatan penting: collection hanya memiliki 1 assertion eksplisit, yaitu di request `Login (Admin)`. Jadi hasil "0 failed" dari Newman belum berarti semua endpoint sudah tervalidasi secara fungsional.

## Ringkasan Stability Baseline

Skenario: collection dijalankan 100 kali berurutan.

- Iterasi: 100
- Total request: 2.800
- Request gagal menurut Newman: 0
- Assertion gagal: 0
- Durasi total: 54,8 detik
- Throughput rata-rata: sekitar 51 request/detik
- Average response time: 10,8 ms
- Min / Max: 1 ms / 153 ms
- p50: 3 ms
- p90: 6 ms
- p95: 108 ms
- p99: 113 ms
- Hasil JSON: `backend/reports/newman-pos-api-100x.json`

Interpretasi: API stabil untuk baseline singkat ini. Tidak ada request yang gagal di level Newman selama 2.800 request. Nilai p95/p99 naik karena endpoint login membutuhkan sekitar 100-120 ms, sementara endpoint read dan forbidden response jauh lebih cepat.

## Endpoint Terlambat

| Endpoint | Status | Count | Avg | p95 | p99 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Login (Admin) | 200 | 100 | 110,5 ms | 116 ms | 152 ms | 153 ms |
| Login (Kasir) | 200 | 100 | 109,6 ms | 116 ms | 120 ms | 126 ms |
| Healthcheck | 200 | 100 | 2,3 ms | 3 ms | 4 ms | 35 ms |
| List Bahan Baku | 200 | 100 | 4,8 ms | 6 ms | 8 ms | 26 ms |
| List Suppliers | 200 | 100 | 4,3 ms | 5 ms | 6 ms | 8 ms |
| Get Menu by ID (with resep) | 200 | 100 | 5,5 ms | 7 ms | 8 ms | 8 ms |
| List Resep Menu | 200 | 100 | 5,7 ms | 7 ms | 8 ms | 8 ms |

## Temuan

1. Token admin tertimpa oleh token kasir.
   - `Login (Admin)` menyimpan token ke environment variable `token`.
   - `Login (Kasir)` juga menyimpan token ke variable `token`.
   - Semua request admin setelah login kasir memakai token kasir, sehingga menghasilkan `403 Forbidden`.

2. Banyak request admin belum benar-benar menguji jalur sukses.
   - Contoh: `List Users`, `Create User`, `Create Bahan Baku (admin)`, `Create Supplier (admin)`, `Create Menu (admin)`, dan endpoint resep admin semuanya mendapat `403`.
   - Ini valid jika tujuannya menguji akses kasir ditolak, tetapi nama request menyiratkan test admin sukses.

3. Coverage assertion masih sangat minim.
   - Collection hanya punya 1 assertion.
   - Perlu tambah assertion status code dan struktur response di setiap endpoint.

4. `k6` tidak tersedia di environment ini.
   - Test load/stress/durability yang lebih realistis belum dijalankan.
   - Baseline 100 iterasi Newman sudah memberi gambaran awal, tetapi belum setara dengan soak test beberapa jam atau concurrent user test.

## Rekomendasi Lanjutan

- Pisahkan token menjadi `adminToken` dan `kasirToken`.
- Untuk request admin, gunakan header `Authorization: Bearer {{adminToken}}`.
- Untuk request kasir/negative test, gunakan `Authorization: Bearer {{kasirToken}}`.
- Tambahkan assertion di setiap request: status code, `success`, schema/field utama, dan response time threshold.
- Jalankan load test dengan k6/Artillery setelah tool tersedia, misalnya 50-100 virtual users selama 10-30 menit untuk baseline awal.
