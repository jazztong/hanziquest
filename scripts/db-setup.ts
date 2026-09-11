/**
 * Creates the database file and tables, then seeds it if empty.
 * Idempotent: safe to run on every `npm run dev`.
 *
 *   npm run db:setup          create + seed if empty
 *   npm run db:reset          delete the file first, then create + seed
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@libsql/client';
import { DDL } from '../src/lib/db/ddl';

const RESET = process.argv.includes('--reset');
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app.db');

function ensureEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) return;
  const example = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(envPath, example.replace('SESSION_SECRET=', `SESSION_SECRET=${secret}`));
  console.log('created .env from .env.example (all API keys left blank - free fallbacks active)');
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'recordings'), { recursive: true });
  ensureEnv();

  if (RESET && fs.existsSync(DB_FILE)) {
    for (const suffix of ['', '-wal', '-shm']) {
      const f = DB_FILE + suffix;
      if (fs.existsSync(f)) fs.rmSync(f);
    }
    console.log('database reset');
  }

  const client = createClient({ url: `file:${DB_FILE}` });
  await client.execute('PRAGMA foreign_keys = ON');
  for (const stmt of DDL) await client.execute(stmt);
  console.log(`schema ready (${DDL.length} statements) -> data/app.db`);

  const { rows } = await client.execute('SELECT COUNT(*) AS n FROM users');
  const userCount = Number(rows[0].n);
  client.close();

  if (userCount === 0) {
    console.log('empty database - seeding...');
    await import('./seed');
  } else {
    console.log(`database already has ${userCount} users - skipping seed`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
