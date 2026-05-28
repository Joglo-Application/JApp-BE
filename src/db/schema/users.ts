import { pgTable, serial, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const userRoleEnum = pgEnum('user_role', ['admin', 'kasir', 'owner']);

export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  namaUser: varchar('nama_user', { length: 100 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('kasir'),
  ...timestamps,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
