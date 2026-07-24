import { z } from 'zod';

/** Profil toko — dipakai header struk & judul layar (menggantikan "[Nama Restoran]"). */
export const tokoSchema = z.object({
  namaToko: z.string().trim().max(100).default('Wedangan Joglo'),
  alamat: z.string().trim().max(255).default(''),
  telepon: z.string().trim().max(30).default(''),
  email: z.string().trim().max(150).default(''),
  // Rincian wilayah — layar Pengaturan Toko mengumpulkannya terpisah dari
  // alamat lengkap.
  negara: z.string().trim().max(60).default(''),
  provinsi: z.string().trim().max(60).default(''),
  kota: z.string().trim().max(60).default(''),
  kecamatan: z.string().trim().max(60).default(''),
  kodePos: z.string().trim().max(10).default(''),
  logoUrl: z.string().trim().max(255).default(''),
  npwp: z.string().trim().max(40).default(''),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
});

/** Sakelar perilaku POS. Kunci layar pengaturan memakai POST /auth/verify-pin. */
export const posSchema = z.object({
  pembulatan: z.boolean().default(false),
  harusPilihMeja: z.boolean().default(true),
  diskonPesanan: z.boolean().default(true),
  catatanPesanan: z.boolean().default(true),
  inAway: z.boolean().default(true),
  splitBill: z.boolean().default(true),
});

export const pajakSchema = z.object({
  pajakAktif: z.boolean().default(true),
  /** Label pajak yang tampil di struk, mis. "Pajak Toko". */
  namaPajak: z.string().trim().max(60).default('Pajak Toko'),
  pajakPersen: z.number().min(0).max(100).default(5),
  /** Tipe pajak toko: 'percent' (dari subtotal) atau 'amount' (nominal Rp tetap). */
  pajakTipe: z.enum(['percent', 'amount']).default('percent'),
  /** Nominal pajak tetap (Rp) yang dipakai bila pajakTipe = 'amount'. */
  pajakNominal: z.number().min(0).default(0),
  biayaLayananAktif: z.boolean().default(true),
  biayaLayananPersen: z.number().min(0).max(100).default(5),
  /** Tipe biaya layanan: 'percent' (dari subtotal) atau 'amount' (nominal Rp). */
  biayaLayananTipe: z.enum(['percent', 'amount']).default('percent'),
  /** Nominal biaya layanan tetap (Rp) bila biayaLayananTipe = 'amount'. */
  biayaLayananNominal: z.number().min(0).default(0),
  // PPN dan Tax dikelola terpisah dari pajak toko di layar Pengaturan Pajak.
  ppnAktif: z.boolean().default(false),
  ppnPersen: z.number().min(0).max(100).default(0),
  taxAktif: z.boolean().default(false),
  taxPersen: z.number().min(0).max(100).default(0),
});

export const mataUangSchema = z.object({
  /** Nama mata uang seperti dipilih di layar, mis. "Rupiah". */
  nama: z.string().trim().max(40).default('Rupiah'),
  kode: z.string().trim().max(10).default('IDR'),
  simbol: z.string().trim().max(10).default('Rp'),
  pemisahRibuan: z.string().max(1).default('.'),
  jumlahDesimal: z.number().int().min(0).max(4).default(0),
});

export const notifikasiSchema = z.object({
  emailPenerima: z.array(z.string().trim().max(150)).default([]),
  notifStokMenipis: z.boolean().default(true),
  notifShiftTutup: z.boolean().default(true),
  notifLaporanHarian: z.boolean().default(false),
});

export const printerSchema = z.object({
  nama: z.string().trim().max(100).default(''),
  alamat: z.string().trim().max(100).default(''),
  series: z.string().trim().max(50).default(''),
  ukuranKertas: z.enum(['58mm', '80mm']).default('80mm'),
});

/** Geofence absensi: batasi check-in ke radius tertentu dari toko. */
export const absensiSchema = z.object({
  batasiArea: z.boolean().default(false),
  jarakMaksimumMeter: z.number().int().min(0).max(100000).default(100),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
});

/** Registry grup pengaturan — sumber tunggal validasi & nilai default. */
export const GRUP_SCHEMAS = {
  toko: tokoSchema,
  pos: posSchema,
  pajak: pajakSchema,
  mataUang: mataUangSchema,
  notifikasi: notifikasiSchema,
  printer: printerSchema,
  absensi: absensiSchema,
} as const;

export type GrupPengaturan = keyof typeof GRUP_SCHEMAS;

export const grupParamSchema = z.object({
  grup: z.enum(
    Object.keys(GRUP_SCHEMAS) as [GrupPengaturan, ...GrupPengaturan[]],
  ),
});

/**
 * Ubah cepat tarif dari layar POS (ketuk baris "Pajak" / "Biaya Layanan").
 * Disetujui PIN supervisor, bukan role owner/admin, supaya kasir bisa memakainya.
 * [target] menentukan tarif mana yang diubah.
 */
export const ubahPajakCepatSchema = z.object({
  target: z.enum(['pajak', 'layanan']).default('pajak'),
  tipe: z.enum(['percent', 'amount']),
  nilai: z.number().min(0),
  pin: z.string().regex(/^\d{4,8}$/, 'PIN harus 4-8 digit angka'),
});

export type UbahPajakCepatInput = z.infer<typeof ubahPajakCepatSchema>;
