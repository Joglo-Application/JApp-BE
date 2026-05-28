import bcrypt from 'bcryptjs';
import { db } from '@/config/database';
import { users } from './schema/users';
import { bahanBaku } from './schema/bahan-baku';
import { suppliers } from './schema/suppliers';
import { menus } from './schema/menus';
import { resepMenu } from './schema/resep-menu';

export async function seed(): Promise<void> {
  console.warn('Seeding database...');

  // 1. Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const [admin] = await db
    .insert(users)
    .values({
      namaUser: 'Administrator',
      username: 'admin',
      password: passwordHash,
      role: 'admin',
    })
    .returning();

  await db.insert(users).values({
    namaUser: 'Kasir 1',
    username: 'kasir1',
    password: await bcrypt.hash('kasir123', 10),
    role: 'kasir',
  });

  console.warn(`  Users seeded (admin/admin123, kasir1/kasir123)`);

  // 2. Suppliers
  const [supplier] = await db
    .insert(suppliers)
    .values([
      {
        namaSupplier: 'CV Sumber Rezeki',
        noTelp: '081234567890',
        alamat: 'Jl. Pasar Baru No. 10, Jakarta',
        email: 'sumberrezeki@example.com',
      },
      {
        namaSupplier: 'PT Bahan Makmur',
        noTelp: '021-5550123',
        alamat: 'Jl. Industri No. 25, Bekasi',
        email: 'bahanmakmur@example.com',
      },
    ])
    .returning();

  console.warn('  Suppliers seeded');

  // 3. Bahan Baku
  const bahanList = await db
    .insert(bahanBaku)
    .values([
      { namaBahan: 'Kopi Bubuk', satuan: 'gram', stok: '5000', stokMinimum: '500', hargaSatuan: 150 },
      { namaBahan: 'Susu UHT', satuan: 'ml', stok: '10000', stokMinimum: '1000', hargaSatuan: 25 },
      { namaBahan: 'Gula Pasir', satuan: 'gram', stok: '8000', stokMinimum: '1000', hargaSatuan: 15 },
      { namaBahan: 'Es Batu', satuan: 'gram', stok: '20000', stokMinimum: '2000', hargaSatuan: 2 },
      { namaBahan: 'Teh Celup', satuan: 'pcs', stok: '200', stokMinimum: '20', hargaSatuan: 500 },
    ])
    .returning();

  console.warn(`  ${bahanList.length} bahan baku seeded`);

  // 4. Menus
  const menuList = await db
    .insert(menus)
    .values([
      { namaMenu: 'Kopi Susu', kategori: 'minuman', harga: 18000 },
      { namaMenu: 'Es Kopi Susu', kategori: 'minuman', harga: 20000 },
      { namaMenu: 'Teh Tarik', kategori: 'minuman', harga: 15000 },
      { namaMenu: 'Kopi Hitam', kategori: 'minuman', harga: 12000 },
    ])
    .returning();

  console.warn(`  ${menuList.length} menus seeded`);

  // 5. Resep Menu (komposisi)
  const [kopiSusu, esKopiSusu, tehTarik, kopiHitam] = menuList;
  const [kopiBubuk, susuUht, gula, esBatu, tehCelup] = bahanList;

  if (!kopiSusu || !esKopiSusu || !tehTarik || !kopiHitam) {
    throw new Error('Failed to seed menus');
  }
  if (!kopiBubuk || !susuUht || !gula || !esBatu || !tehCelup) {
    throw new Error('Failed to seed bahan baku');
  }

  await db.insert(resepMenu).values([
    // Kopi Susu: 10g kopi + 100ml susu + 10g gula
    { menuId: kopiSusu.menuId, bahanId: kopiBubuk.bahanId, jumlahPakai: '10' },
    { menuId: kopiSusu.menuId, bahanId: susuUht.bahanId, jumlahPakai: '100' },
    { menuId: kopiSusu.menuId, bahanId: gula.bahanId, jumlahPakai: '10' },
    // Es Kopi Susu: 10g kopi + 100ml susu + 10g gula + 150g es
    { menuId: esKopiSusu.menuId, bahanId: kopiBubuk.bahanId, jumlahPakai: '10' },
    { menuId: esKopiSusu.menuId, bahanId: susuUht.bahanId, jumlahPakai: '100' },
    { menuId: esKopiSusu.menuId, bahanId: gula.bahanId, jumlahPakai: '10' },
    { menuId: esKopiSusu.menuId, bahanId: esBatu.bahanId, jumlahPakai: '150' },
    // Teh Tarik: 1 teh + 80ml susu + 15g gula
    { menuId: tehTarik.menuId, bahanId: tehCelup.bahanId, jumlahPakai: '1' },
    { menuId: tehTarik.menuId, bahanId: susuUht.bahanId, jumlahPakai: '80' },
    { menuId: tehTarik.menuId, bahanId: gula.bahanId, jumlahPakai: '15' },
    // Kopi Hitam: 12g kopi + 5g gula
    { menuId: kopiHitam.menuId, bahanId: kopiBubuk.bahanId, jumlahPakai: '12' },
    { menuId: kopiHitam.menuId, bahanId: gula.bahanId, jumlahPakai: '5' },
  ]);

  console.warn('  Resep menu seeded');

  void admin;
  void supplier;
  console.warn('Seed completed!');
}
