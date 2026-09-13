/**
 * Emit the schema and the seeded data as SQL that wrangler can feed to D1.
 *
 * D1 cannot import a SQLite file, and the seed script writes through libSQL to
 * a local one. Rather than rewrite the seed against D1 - and lose the ability
 * to run it offline - this dumps what the seed produced into plain SQL, which
 * applies identically to the local D1 and the remote one.
 *
 * Usage: npm run d1:export, then apply data/d1/schema.sql and data/d1/seed.sql.
 */
import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { DDL } from '../src/lib/db/ddl';

const OUT = path.join(process.cwd(), 'data', 'd1');
const DB = path.join(process.cwd(), 'data', 'app.db');

/** SQL literal for a value read back from SQLite. */
function lit(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'bigint') return v.toString();
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
    const bytes = new Uint8Array(v as ArrayBuffer);
    return `X'${Buffer.from(bytes).toString('hex')}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * Tables ordered so a parent is always written before its children.
 *
 * sqlite_master lists tables alphabetically, which put `attempts` before
 * `users` and failed the entire import on one foreign key. The order is
 * derived from the REFERENCES clauses in the DDL rather than hand-maintained,
 * so adding a table later cannot quietly reintroduce the problem.
 */
function inDependencyOrder(tables: string[]): string[] {
  const ddl = DDL.join('\n');
  const deps = new Map<string, Set<string>>();

  for (const t of tables) {
    const start = ddl.indexOf(`CREATE TABLE IF NOT EXISTS ${t} (`);
    const body = start < 0 ? '' : ddl.slice(start, ddl.indexOf('\n  )', start));
    const refs = new Set<string>();
    for (const m of body.matchAll(/REFERENCES\s+([a-z_]+)/g)) {
      if (m[1] !== t && tables.includes(m[1])) refs.add(m[1]);
    }
    deps.set(t, refs);
  }

  const out: string[] = [];
  const done = new Set<string>();
  const visit = (t: string, trail: Set<string>) => {
    // A cycle just keeps its alphabetical position rather than looping forever.
    if (done.has(t) || trail.has(t)) return;
    trail.add(t);
    for (const d of deps.get(t) ?? []) visit(d, trail);
    trail.delete(t);
    done.add(t);
    out.push(t);
  };
  for (const t of tables) visit(t, new Set());
  return out;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // The DDL strings carry no terminator of their own.
  fs.writeFileSync(path.join(OUT, 'schema.sql'), DDL.map((s) => `${s};`).join('\n\n') + '\n');
  console.log(`schema.sql: ${DDL.length} statements`);

  const client = createClient({ url: `file:${DB}` });
  const listed = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  const names = inDependencyOrder(
    listed.rows.map((t) => String(t.name)).filter((n) => !n.startsWith('_cf')),
  );

  const out: string[] = [];
  let rowCount = 0;
  for (const table of names) {
    const rows = await client.execute(`SELECT * FROM ${table}`);
    if (!rows.rows.length) continue;
    const cols = rows.columns;
    out.push(`-- ${table} (${rows.rows.length} rows)`);
    for (const r of rows.rows) {
      const values = cols.map((c) => lit((r as unknown as Record<string, unknown>)[c]));
      out.push(`INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')});`);
      rowCount++;
    }
    out.push('');
  }

  fs.writeFileSync(path.join(OUT, 'seed.sql'), out.join('\n'));
  console.log(`seed.sql:   ${rowCount} rows across ${names.length} tables`);
  console.log(`order:      ${names.join(' -> ')}`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
