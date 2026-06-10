import { relations } from 'drizzle-orm';
import { users } from './schema/users';
import { bahanBaku } from './schema/bahan-baku';
import { suppliers } from './schema/suppliers';
import { menus } from './schema/menus';
import { resepMenu } from './schema/resep-menu';
import { meja } from './schema/meja';
import { member } from './schema/member';
import { memberPoinLog } from './schema/member-poin-log';
import { pesanan } from './schema/pesanan';
import { detailPesanan } from './schema/detail-pesanan';
import { pesananBahan } from './schema/pesanan-bahan';
import { transaksiBahanMasuk } from './schema/transaksi-bahan-masuk';
import { transaksiBahanKeluar } from './schema/transaksi-bahan-keluar';
import { pembayaran } from './schema/pembayaran';

export const usersRelations = relations(users, ({ many }) => ({
  pesanan: many(pesanan),
  pesananBahan: many(pesananBahan),
  transaksiBahanMasuk: many(transaksiBahanMasuk),
  transaksiBahanKeluar: many(transaksiBahanKeluar),
}));

export const bahanBakuRelations = relations(bahanBaku, ({ many }) => ({
  resepMenu: many(resepMenu),
  pesananBahan: many(pesananBahan),
  transaksiBahanMasuk: many(transaksiBahanMasuk),
  transaksiBahanKeluar: many(transaksiBahanKeluar),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  pesananBahan: many(pesananBahan),
  transaksiBahanMasuk: many(transaksiBahanMasuk),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  resepMenu: many(resepMenu),
  detailPesanan: many(detailPesanan),
}));

export const resepMenuRelations = relations(resepMenu, ({ one }) => ({
  menu: one(menus, { fields: [resepMenu.menuId], references: [menus.menuId] }),
  bahanBaku: one(bahanBaku, { fields: [resepMenu.bahanId], references: [bahanBaku.bahanId] }),
}));

export const mejaRelations = relations(meja, ({ many }) => ({
  pesanan: many(pesanan),
}));

export const memberRelations = relations(member, ({ many }) => ({
  pesanan: many(pesanan),
  poinLog: many(memberPoinLog),
}));

export const memberPoinLogRelations = relations(memberPoinLog, ({ one }) => ({
  member: one(member, {
    fields: [memberPoinLog.memberId],
    references: [member.memberId],
  }),
  pesanan: one(pesanan, {
    fields: [memberPoinLog.pesananId],
    references: [pesanan.pesananId],
  }),
}));

export const pesananRelations = relations(pesanan, ({ one, many }) => ({
  user: one(users, { fields: [pesanan.userId], references: [users.userId] }),
  meja: one(meja, { fields: [pesanan.mejaId], references: [meja.mejaId] }),
  member: one(member, { fields: [pesanan.memberId], references: [member.memberId] }),
  detailPesanan: many(detailPesanan),
  pembayaran: one(pembayaran),
  transaksiBahanKeluar: many(transaksiBahanKeluar),
}));

export const detailPesananRelations = relations(detailPesanan, ({ one }) => ({
  pesanan: one(pesanan, {
    fields: [detailPesanan.pesananId],
    references: [pesanan.pesananId],
  }),
  menu: one(menus, { fields: [detailPesanan.menuId], references: [menus.menuId] }),
}));

export const pesananBahanRelations = relations(pesananBahan, ({ one }) => ({
  bahanBaku: one(bahanBaku, {
    fields: [pesananBahan.bahanId],
    references: [bahanBaku.bahanId],
  }),
  supplier: one(suppliers, {
    fields: [pesananBahan.supplierId],
    references: [suppliers.supplierId],
  }),
  user: one(users, { fields: [pesananBahan.userId], references: [users.userId] }),
  transaksiMasuk: one(transaksiBahanMasuk),
}));

export const transaksiBahanMasukRelations = relations(transaksiBahanMasuk, ({ one }) => ({
  pesananBahan: one(pesananBahan, {
    fields: [transaksiBahanMasuk.pesananBahanId],
    references: [pesananBahan.pesananBahanId],
  }),
  bahanBaku: one(bahanBaku, {
    fields: [transaksiBahanMasuk.bahanId],
    references: [bahanBaku.bahanId],
  }),
  supplier: one(suppliers, {
    fields: [transaksiBahanMasuk.supplierId],
    references: [suppliers.supplierId],
  }),
  user: one(users, { fields: [transaksiBahanMasuk.userId], references: [users.userId] }),
}));

export const transaksiBahanKeluarRelations = relations(transaksiBahanKeluar, ({ one }) => ({
  bahanBaku: one(bahanBaku, {
    fields: [transaksiBahanKeluar.bahanId],
    references: [bahanBaku.bahanId],
  }),
  pesanan: one(pesanan, {
    fields: [transaksiBahanKeluar.pesananId],
    references: [pesanan.pesananId],
  }),
  user: one(users, { fields: [transaksiBahanKeluar.userId], references: [users.userId] }),
}));

export const pembayaranRelations = relations(pembayaran, ({ one }) => ({
  pesanan: one(pesanan, {
    fields: [pembayaran.pesananId],
    references: [pesanan.pesananId],
  }),
}));
