import type { NewMenu } from '../schema/menus';

/**
 * Daftar menu Wedangan Joglo (dari daftar menu fisik).
 * kategori: SPESIAL JOGLO + SEGO LAN LAWUH -> 'makanan', ANGKRINGAN -> 'snack'.
 * harga dalam rupiah penuh (mis. 28 K/Porsi -> 28000).
 * Sumber tunggal: dipakai oleh seed.ts dan scripts/seed-menus.ts.
 */
export const wedanganMenuData: NewMenu[] = [
  // --- SPESIAL JOGLO (makanan) ---
  { namaMenu: 'Bakmi Joglo Goreng', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Bakmi Joglo Nyemek', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Bakmi Joglo Godhog', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Gudeg Ayam', kategori: 'makanan', harga: 35000 },
  { namaMenu: 'Nasi Paru Babat', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Nasi Goreng Kemangi', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Nasi Goreng Kampung', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Nasi Sop Empal', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Gule Joglo', kategori: 'makanan', harga: 35000 },
  { namaMenu: 'Pisang Goreng Joglo', kategori: 'makanan', harga: 25000 },
  { namaMenu: 'Pisang Bakar Joglo', kategori: 'makanan', harga: 25000 },
  { namaMenu: 'Roti Bakar', kategori: 'makanan', harga: 25000 },
  // Serabi Joglo (varian)
  { namaMenu: 'Serabi Joglo Original', kategori: 'makanan', harga: 7000 },
  { namaMenu: 'Serabi Joglo Selai Sarikaya', kategori: 'makanan', harga: 8000 },
  { namaMenu: 'Serabi Joglo Selai Cokelat', kategori: 'makanan', harga: 10000 },
  { namaMenu: 'Serabi Joglo Original Butter', kategori: 'makanan', harga: 20000 },

  // --- SEGO LAN LAWUH (makanan) ---
  { namaMenu: 'Nasi Rawon', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Ayam Goreng', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Ayam Bakar Urap', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Iga Goreng', kategori: 'makanan', harga: 45000 },
  { namaMenu: 'Nasi Garang Asem Ayam', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Bakso Campur', kategori: 'makanan', harga: 25000 },
  { namaMenu: 'Nasi Sup Iga', kategori: 'makanan', harga: 45000 },
  { namaMenu: 'Nasi Paru Masak Pedas', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Gongso Babat', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Garang Asem Bandeng', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Nasi Ayam Lodho', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Selad Solo', kategori: 'makanan', harga: 30000 },
  { namaMenu: 'Gado-gado', kategori: 'makanan', harga: 28000 },
  { namaMenu: 'Ikan Bandeng Goreng', kategori: 'makanan', harga: 40000 },
  { namaMenu: 'Ikan Bandeng Bakar', kategori: 'makanan', harga: 40000 },
  { namaMenu: 'Ikan Nila Pesmol', kategori: 'makanan', harga: 45000 },
  { namaMenu: 'Ikan Nila Bakar', kategori: 'makanan', harga: 40000 },
  { namaMenu: 'Ikan Gurami Goreng', kategori: 'makanan', harga: 60000 },
  { namaMenu: 'Ikan Gurami Bakar', kategori: 'makanan', harga: 70000 },
  { namaMenu: 'Cah Kangkung', kategori: 'makanan', harga: 15000 },
  { namaMenu: 'Cah Tauge', kategori: 'makanan', harga: 15000 },
  { namaMenu: 'Ayam Bakar Utuh', kategori: 'makanan', harga: 85000 },
  { namaMenu: 'Nasi Putih', kategori: 'makanan', harga: 8000 },

  // --- ANGKRINGAN (snack) ---
  { namaMenu: 'Nasi Bakar Sambel Teri', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Usus Ayam', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Telor Puyuh', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Ampela', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Cecek', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Bakso', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Sosis', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Ayam Pedas', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Ceker Ayam', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Kulit Ayam', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Udang', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Kerang', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Kepiting', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Kol Nenek', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Bakso Ikan', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Scalop', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Sate Cumi-cumi', kategori: 'snack', harga: 6000 },
  { namaMenu: 'Tahu Bacem', kategori: 'snack', harga: 5000 },
  { namaMenu: 'Tempe Bacem', kategori: 'snack', harga: 5000 },
  { namaMenu: 'Jadah', kategori: 'snack', harga: 8000 },
];
