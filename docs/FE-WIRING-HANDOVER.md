# FE ⇄ BE Wiring Handover

Daftar integrasi yang **backend-nya sudah siap & live** tapi belum tersambung di frontend.
Base URL: `http://54.153.133.48:3000/api/v1` · Auth: header `Authorization: Bearer <token>` ·
Envelope sukses: `{ "success": true, "data": ... , "meta"?: {...} }`.

Semua endpoint di bawah sudah dideploy & diverifikasi live (status terakhir di bagian masing-masing).
**Tidak ada perubahan backend yang dibutuhkan** untuk item 1–6 — murni pekerjaan wiring di FE.

Urutan rekomendasi: **1 → 2 → 3** (paling cepat, tinggal buka stub), lalu **4** (paling bernilai), lalu **5, 6**.

---

## 1. Riwayat Transaksi — `GET /transaksi?date=YYYY-MM-DD`

- **FE file:** `lib/features/pos/data/datasources/transaksi_remote_datasource.dart`
- **Kondisi:** datasource sudah ada, body asli **sudah ditulis tapi di-comment** (baris ~18–30). Tinggal **buka comment** & hapus `_kStubData`.
- **Query:** `date` (opsional, default hari ini). **Response cocok 100%** dengan `TransaksiModel.fromJson` (sudah diverifikasi).

Contoh response:
```json
{ "success": true, "data": [
  { "kodeTransaksi": "TRX-0001", "waktu": "2026-06-18T12:34:41.355Z",
    "namaStaff": "Administrator", "namaKontak": "Budi", "tipePembayaran": "TUNAI",
    "nominalPembayaran": 45200, "subtotal": 32000,
    "biayaLayananPct": 5, "biayaLayanan": 1600, "pajakTokoPct": 5, "pajakToko": 1600,
    "items": [ { "nama": "Coklat Panas", "hargaSatuan": 16000, "qty": 2, "total": 32000 } ],
    "total": 35200 } ] }
```
> Akan `[]` sampai ada transaksi berbayar (lihat item 4).

---

## 2. Inventori Produk — `GET /inventori`

- **FE file:** `lib/features/pos/data/datasources/inventori_remote_datasource.dart`
- **Kondisi:** **STUB** (`Future.delayed` + `_kStubData`). Ganti dengan `_client.dio.get('/inventori')`, baca `res.data['data']`.
- **Response cocok 100%** dengan `InventoriItemModel.fromJson`.

```json
{ "success": true, "data": [
  { "id": "INV-001", "nama": "Kopi Susu", "kategori": "minuman",
    "qtyStok": 0, "qtyTahan": 0, "imageUrl": null } ] }
```
> `qtyStok/qtyTahan` saat ini 0 — isi via `PATCH /menus/{id}` body `{"stok":50,"stokMinimum":10,"imageUrl":"..."}`.

---

## 3. Stok Gudang — `GET /stok-gudang`

- **FE file:** `lib/features/owner/data/datasources/stok_gudang_remote_datasource.dart`
- **Kondisi:** **STUB** (baris ~16–19). Ganti dengan `_client.dio.get('/stok-gudang')`.
- **Response cocok 100%** dengan `StokGudangItemModel.fromJson`.

```json
{ "success": true, "data": [
  { "id": "STK-001", "nama": "Kopi Bubuk", "kategori": "", "unitProduk": "gram",
    "qtyStok": 4920, "qtyTahan": 500, "imageUrl": null } ] }
```
> `kategori` masih `""` — isi via `PATCH /bahan-baku/{id}` body `{"kategori":"Bahan Kering","imageUrl":"..."}`.

---

## 4. Submit Checkout — `POST /pesanan` lalu `POST /pembayaran`

- **FE:** `OrderProvider` sudah punya datanya (items, diskon, orderType, customerName) tapi **belum submit**. Perlu **datasource baru** + dipanggil saat bayar. Tidak ada halaman baru.
- **Alur:** (1) `POST /pesanan` → dapat `pesananId` + `total` (server yang hitung pajak/layanan/diskon). (2) `POST /pembayaran` dengan `pesananId` → dapat `kembalian`.

**POST /pesanan** (role admin/kasir) — request:
```json
{
  "items": [
    { "menuId": 5, "jumlah": 2, "diskon": 0, "catatan": "opsional" },
    { "namaCustom": "Titipan", "hargaSatuan": 25000, "jumlah": 1 }
  ],
  "customerNama": "Budi",
  "orderType": "dine_in",            // dine_in|take_away|gofood|grabfood|shopeefood
  "catatan": "opsional",
  "mejaId": 1,                        // opsional (lihat item 6)
  "memberId": 3,                      // opsional (lihat item 5)
  "diskon": { "tipe": "percent", "nilai": 10, "promoNama": "opsional" }  // opsional; tipe: amount|percent
}
```
Tiap item **wajib** `menuId` ATAU (`namaCustom` + `hargaSatuan`). Response berisi `pesananId`, `subtotal`, `serviceCharge`, `pajak`, `diskon`, `total`, dst.

**Mapping FE → BE:** `OrderItem.productId → menuId`, `qty → jumlah`; `OrderType` enum FE → string BE (`dine_in`…); `orderDiscount`+`orderDiscountType` → `diskon{tipe(amount|percent), nilai}`.

**POST /pembayaran** (role admin/kasir) — request:
```json
{ "pesananId": 11, "metode": "cash", "jumlahBayar": 20000 }  // metode: cash|qris|debit|transfer|qris_netzme
```
Response: `{ pembayaranId, metode, jumlahBayar, kembalian, pesananId }`. Setelah ini transaksi muncul di item 1.

---

## 5. Pilih Member — `GET /member?q=` · `POST /member`

- **FE file:** `lib/features/pos/presentation/pages/pilih_member_page.dart` (sekarang **mock** `_Member`/`SelectedMember`, tanpa datasource). Perlu datasource baru.
- `GET /member?q=<cari>&page&limit` → paginated. `POST /member` `{ "nama": "...", "noTelp": "...", "email": "..." }` untuk daftar member baru saat transaksi (role admin/kasir).

Response item member:
```json
{ "memberId": 3, "nama": "Ahmad", "noTelp": "0812...", "email": null, "poin": 50 }
```
**Mapping:** `memberId → id`, `nama → name`, `poin → points`, `noTelp → phone`. Hasil pilih dipakai sebagai `memberId` di `POST /pesanan` (item 4).
> Prod belum ada member (`data: []`) — FE perlu handle kosong + alur tambah member.

---

## 6. Pilih Meja — `GET /meja?zona=&status=`

- **FE file:** `lib/features/pos/presentation/pages/pilih_meja_page.dart` (sekarang **mock** `_Meja`, tanpa datasource). Perlu datasource baru.
- `GET /meja` → paginated. Tab zona dibangun dari nilai `zona` distinct. `PATCH /meja/{id}/status` `{ "status": "occupied" }` (role admin/kasir) untuk ubah status.

Response item meja:
```json
{ "mejaId": 1, "nomor": "A1", "zona": "Indoor", "kapasitas": 4, "status": "available" }
```
**Mapping:** `mejaId → id`, `nomor → name`, `zona → zoneId/zona tab`, `status` (`available→free`, `occupied`, `reserved`). Meja terpilih dipakai sebagai `mejaId` di `POST /pesanan` (item 4).
> ⚠️ FE punya status `blocked` yang **tidak ada di BE** (`available|occupied|reserved`). Bila `blocked` mau dipersist, butuh penyesuaian BE — diskusikan dulu.

---

## Di luar list (butuh kerja BE dulu, BUKAN sekadar wiring)
- **Owner Fase 2**: dashboard, laporan, pengaturan toko/POS/pajak, pegawai, voucher, loyalty, metode-pembayaran → belum ada endpoint BE.
- **Role-based access**: BE sudah kirim `role` di `/auth/login`, tapi enum BE baru `admin|kasir|owner` sedangkan FE mengenal `supervisor|dapur|gudang` → perlu perluasan enum + (mungkin) endpoint `/pegawai` saat FE menerapkannya.
