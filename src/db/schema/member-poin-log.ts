import { pgTable, serial, integer, pgEnum, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createdAtOnly } from './_helpers';
import { member } from './member';
import { pesanan } from './pesanan';

export const poinTipeEnum = pgEnum('poin_tipe', ['earn', 'redeem', 'adjustment']);

export const memberPoinLog = pgTable('member_poin_log', {
  poinLogId: serial('poin_log_id').primaryKey(),
  tanggal: date('tanggal').notNull().default(sql`CURRENT_DATE`),
  tipe: poinTipeEnum('tipe').notNull(),
  poin: integer('poin').notNull(),
  memberId: integer('member_id')
    .notNull()
    .references(() => member.memberId, { onDelete: 'cascade' }),
  pesananId: integer('pesanan_id').references(() => pesanan.pesananId, {
    onDelete: 'set null',
  }),
  ...createdAtOnly,
});

export type MemberPoinLog = typeof memberPoinLog.$inferSelect;
export type NewMemberPoinLog = typeof memberPoinLog.$inferInsert;
