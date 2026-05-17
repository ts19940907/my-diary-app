import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});

export const diaries = sqliteTable(
  'diaries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userEmail: text('user_email').notNull(),
    date: text('date').notNull(),
    work: text('work').notNull().default(''),
    issue: text('issue').notNull().default(''),
    solution: text('solution').notNull().default(''),
    summary: text('summary').notNull().default(''),
  },
  (table) => [uniqueIndex('diaries_user_date_idx').on(table.userEmail, table.date)],
);
