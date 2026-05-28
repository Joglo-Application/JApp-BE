import { timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
};

export const createdAtOnly = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};
