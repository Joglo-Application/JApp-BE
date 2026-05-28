# POS API Performance Test Report

Tanggal test: 2026-05-28T04:25:45.926Z
Base URL: `http://localhost:3000/api/v1`

## Response Time Test

Skenario: 50 ronde sequential untuk endpoint utama.

| Metric | Value |
| --- | ---: |
| Total request | 550 |
| Error | 0 |
| Error rate | 0% |
| Avg | 23.22 ms |
| p50 | 3.85 ms |
| p90 | 109.46 ms |
| p95 | 112.88 ms |
| p99 | 124.75 ms |
| Max | 141.32 ms |

Grafik: [response-time-chart.svg](response-time-chart.svg)

| Endpoint | Count | Error | Avg | p95 | p99 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Login Admin | 50 | 0 | 110.61 ms | 122.84 ms | 126.67 ms | 126.67 ms |
| Login Kasir | 50 | 0 | 112.73 ms | 128.05 ms | 141.32 ms | 141.32 ms |
| Get Me | 50 | 0 | 4.1 ms | 5.08 ms | 6.02 ms | 6.02 ms |
| Healthcheck | 50 | 0 | 1.5 ms | 1.81 ms | 2.53 ms | 2.53 ms |
| List Bahan Baku | 50 | 0 | 4.21 ms | 4.95 ms | 23.4 ms | 23.4 ms |
| Get Bahan Baku by ID | 50 | 0 | 3.27 ms | 4.52 ms | 4.93 ms | 4.93 ms |
| List Suppliers | 50 | 0 | 3.56 ms | 4.77 ms | 6.3 ms | 6.3 ms |
| Get Supplier by ID | 50 | 0 | 3.09 ms | 3.83 ms | 4.54 ms | 4.54 ms |
| List Menus | 50 | 0 | 3.37 ms | 4.11 ms | 6.31 ms | 6.31 ms |
| Get Menu by ID | 50 | 0 | 4.61 ms | 5.54 ms | 7.02 ms | 7.02 ms |
| List Resep Menu | 50 | 0 | 4.43 ms | 5.38 ms | 5.88 ms | 5.88 ms |

## Stress Test

Skenario: concurrency bertahap `1, 10, 25, 50, 100`, durasi 10 detik per stage.

| Metric | Value |
| --- | ---: |
| Total request | 40068 |
| Error | 0 |
| Error rate | 0% |
| Avg | 46.5 ms |
| p50 | 25.47 ms |
| p90 | 105.1 ms |
| p95 | 136.65 ms |
| p99 | 207.41 ms |
| Max | 288.38 ms |

Grafik: [stress-test-chart.svg](stress-test-chart.svg)

| Concurrency | Requests | RPS | Error | Error Rate | Avg | p95 | p99 | Max |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 3814 | 381.36 | 0 | 0% | 2.61 ms | 3.87 ms | 4.55 ms | 7.58 ms |
| 10 | 9137 | 913.17 | 0 | 0% | 10.93 ms | 19.05 ms | 22.29 ms | 43.85 ms |
| 25 | 9214 | 919.51 | 0 | 0% | 27.14 ms | 49.06 ms | 53.49 ms | 73.89 ms |
| 50 | 9009 | 898.03 | 0 | 0% | 55.55 ms | 101.24 ms | 111.52 ms | 134.11 ms |
| 100 | 8894 | 883.58 | 0 | 0% | 112.74 ms | 206.56 ms | 225.21 ms | 288.38 ms |

## Catatan

- Stress test memakai endpoint GET dan `GET /auth/me` agar tidak mengubah data.
- Login tetap diuji di response time test, tetapi tidak dimasukkan ke stress test agar hasil stress tidak didominasi biaya hashing password.
- File data mentah: [api-performance-results.json](api-performance-results.json)
