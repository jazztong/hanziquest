import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * A single libSQL connection reused across hot reloads.
 *
 * libSQL was chosen over Postgres/Supabase so `npm run dev` works with zero
 * services, zero accounts and zero keys - which the brief requires - while
 * still leaving a one-line path to hosted Turso later (change DATABASE_URL to a
 * libsql:// URL and add an auth token; no other code changes).
 * Logged in docs/decisions.md as D-002.
 */
const url = process.env.DATABASE_URL ?? 'file:./data/app.db';

declare global {
  // eslint-disable-next-line no-var
  var __hanziQuestDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function make() {
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

export const db = globalThis.__hanziQuestDb ?? make();
if (process.env.NODE_ENV !== 'production') globalThis.__hanziQuestDb = db;

export { schema };
export * from './schema';
