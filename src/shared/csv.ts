/** Zona waktu operasional toko, dipakai untuk menampilkan waktu di ekspor. */
const ZONA_WAKTU = 'Asia/Jakarta';

/** Escape satu sel CSV (kutip bila mengandung koma, kutip, atau baris baru). */
function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Susun baris-baris menjadi teks CSV. */
export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/**
 * Format timestamp ke waktu lokal toko (YYYY-MM-DD HH:MM:SS). Sengaja tidak
 * memakai toISOString() yang selalu UTC — pembaca laporan mengharapkan WIB.
 */
export function waktuLokal(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toLocaleString('sv-SE', { timeZone: ZONA_WAKTU });
}

/** Ambil bagian jam saja (HH:MM) dalam waktu lokal toko. */
export function jamLokal(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toLocaleTimeString('sv-SE', {
    timeZone: ZONA_WAKTU,
    hour: '2-digit',
    minute: '2-digit',
  });
}
