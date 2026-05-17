import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data/diary.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

let initialized = false;

export async function ensureDb() {
  if (initialized) return;

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      date TEXT NOT NULL,
      work TEXT NOT NULL DEFAULT '',
      issue TEXT NOT NULL DEFAULT '',
      solution TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      UNIQUE(user_email, date)
    )
  `);

  initialized = true;
}
