import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { DDL } from '@/lib/db/ddl';
import * as schema from '@/lib/db/schema';
import { buildPrompt, type Manifest } from '../scripts/gen-art';

// ---------------------------------------------------------------------------
// Schema drift
// ---------------------------------------------------------------------------

/**
 * The DDL is hand-written so `npm run dev` needs no migration tooling. That
 * duplication is only safe if something checks it, which is what this does.
 */
describe('database schema', () => {
  const ddl = DDL.join('\n');

  const tables = Object.values(schema)
    .filter((v): v is never => {
      try {
        getTableConfig(v as never);
        return true;
      } catch {
        return false;
      }
    })
    .map((t) => getTableConfig(t));

  it('finds the declared tables', () => {
    expect(tables.length).toBeGreaterThan(10);
  });

  it('has a CREATE TABLE for every table in the Drizzle schema', () => {
    for (const t of tables) {
      expect({ table: t.name, present: ddl.includes(`CREATE TABLE IF NOT EXISTS ${t.name} `) }).toEqual(
        { table: t.name, present: true },
      );
    }
  });

  it('has every column of every table in the DDL', () => {
    for (const t of tables) {
      const stmt = DDL.find((s) => s.includes(`CREATE TABLE IF NOT EXISTS ${t.name} `));
      expect(stmt).toBeDefined();
      for (const col of t.columns) {
        expect({ table: t.name, column: col.name, present: new RegExp(`\\b${col.name}\\b`).test(stmt!) }).toEqual(
          { table: t.name, column: col.name, present: true },
        );
      }
    }
  });

  it('creates every declared index', () => {
    for (const t of tables) {
      for (const idx of t.indexes) {
        const name = idx.config.name;
        expect({ index: name, present: ddl.includes(name) }).toEqual({ index: name, present: true });
      }
    }
  });

  it('declares no column in the DDL that the schema does not have', () => {
    for (const t of tables) {
      const stmt = DDL.find((s) => s.includes(`CREATE TABLE IF NOT EXISTS ${t.name} `))!;
      const inner = stmt.slice(stmt.indexOf('(') + 1, stmt.lastIndexOf(')'));
      const ddlCols = inner
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)/i.test(l))
        .map((l) => l.split(/\s+/)[0]);
      const schemaCols = new Set(t.columns.map((c) => c.name));
      for (const c of ddlCols) {
        expect({ table: t.name, column: c, known: schemaCols.has(c) }).toEqual({
          table: t.name,
          column: c,
          known: true,
        });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Art manifest
// ---------------------------------------------------------------------------

describe('art manifest', () => {
  const manifestPath = path.join(process.cwd(), 'art', 'manifest.json');
  const stylePath = path.join(process.cwd(), 'art', 'style.md');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  const styleMd = fs.readFileSync(stylePath, 'utf8');

  it('exists and has entries', () => {
    expect(manifest.entries.length).toBeGreaterThan(20);
  });

  it('gives every entry a unique id', () => {
    const ids = manifest.entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every entry a valid status', () => {
    const ok = new Set(['pending', 'done', 'failed', 'placeholder']);
    for (const e of manifest.entries) {
      expect({ id: e.id, status: e.status, valid: ok.has(e.status) }).toEqual({
        id: e.id,
        status: e.status,
        valid: true,
      });
    }
  });

  it('writes everything under art/out and names the file after the id', () => {
    for (const e of manifest.entries) {
      expect(e.out).toBe(`art/out/${e.id}.png`);
    }
  });

  it('uses a parseable WxH size', () => {
    for (const e of manifest.entries) {
      expect({ id: e.id, size: /^\d{3,4}x\d{3,4}$/.test(e.size) }).toEqual({ id: e.id, size: true });
    }
  });

  it('covers the initial asset set the brief asks for', () => {
    const byType = new Map<string, number>();
    for (const e of manifest.entries) byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
    expect(byType.get('avatar') ?? 0).toBeGreaterThanOrEqual(4);
    expect(byType.get('character') ?? 0).toBeGreaterThanOrEqual(4);
    expect(byType.get('map') ?? 0).toBeGreaterThanOrEqual(1);
    expect(byType.get('boss') ?? 0).toBeGreaterThanOrEqual(1);
    expect(byType.get('scene') ?? 0).toBeGreaterThanOrEqual(3);
    // One relic per 默写 poem, and one card frame per rarity.
    expect(byType.get('relic') ?? 0).toBe(14);
    expect(byType.get('card') ?? 0).toBe(5);
  });

  it('refers only to character sheets that exist in the manifest', () => {
    const ids = new Set(manifest.entries.map((e) => e.id));
    for (const e of manifest.entries) {
      for (const ref of e.refs ?? []) {
        expect({ id: e.id, ref, known: ids.has(ref) }).toEqual({ id: e.id, ref, known: true });
      }
    }
  });

  it('gives every character sheet a reusable description', () => {
    for (const e of manifest.entries) {
      if (e.type !== 'character') continue;
      expect({ id: e.id, described: (e.description ?? '').length > 30 }).toEqual({
        id: e.id,
        described: true,
      });
    }
  });

  it('builds a prompt carrying the global style and the no-text rule', () => {
    const entry = manifest.entries.find((e) => e.type === 'character' && !e.refs?.length)!;
    const prompt = buildPrompt(entry, manifest, styleMd);
    expect(prompt).toMatch(/Painterly digital illustration/);
    expect(prompt).toMatch(/no text/i);
    expect(prompt).toContain(entry.prompt);
  });

  it('puts the genre direction into a genre entry and leaves it out otherwise', () => {
    const genreEntry = manifest.entries.find((e) => e.genre === 'mystery')!;
    const neutral = manifest.entries.find((e) => e.genre === null)!;
    expect(buildPrompt(genreEntry, manifest, styleMd)).toMatch(/Genre direction:/);
    expect(buildPrompt(neutral, manifest, styleMd)).not.toMatch(/Genre direction:/);
  });

  it('refuses to build a scene prompt before its character sheet is generated', () => {
    const scene = manifest.entries.find((e) => (e.refs?.length ?? 0) > 0);
    if (!scene) return;
    const refId = scene.refs![0];
    const stubbed: Manifest = {
      ...manifest,
      entries: manifest.entries.map((e) =>
        e.id === refId ? { ...e, status: 'pending' as const } : e,
      ),
    };
    expect(() => buildPrompt(scene, stubbed, styleMd)).toThrow(/generate sheets before scenes/);
  });

  it('appends the no-text rule to every assembled prompt', () => {
    // The rule lives in buildPrompt's suffix, not in each entry's shot text -
    // so this asserts on what is actually sent to the model, which is the thing
    // that matters. Entries whose character sheet is not generated yet are
    // skipped: buildPrompt is supposed to refuse those (tested above).
    const done = new Set(manifest.entries.filter((e) => e.status === 'done').map((e) => e.id));
    for (const e of manifest.entries) {
      if ((e.refs ?? []).some((r) => !done.has(r))) continue;
      const prompt = buildPrompt(e, manifest, styleMd);
      expect({ id: e.id, forbidsText: /Absolutely no text/i.test(prompt) }).toEqual({
        id: e.id,
        forbidsText: true,
      });
      expect({ id: e.id, forbidsGlyphs: /Chinese characters/i.test(prompt) }).toEqual({
        id: e.id,
        forbidsGlyphs: true,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Environment contract
// ---------------------------------------------------------------------------

describe('environment', () => {
  it('documents every key the code reads', () => {
    const example = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    for (const key of [
      'ANTHROPIC_API_KEY',
      'AZURE_SPEECH_KEY',
      'AZURE_SPEECH_REGION',
      'DATABASE_URL',
      'SESSION_SECRET',
    ]) {
      expect({ key, documented: example.includes(key) }).toEqual({ key, documented: true });
    }
  });

  it('ships no key values in .env.example', () => {
    const example = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    expect(example).toMatch(/ANTHROPIC_API_KEY=\s*$/m);
    expect(example).toMatch(/AZURE_SPEECH_KEY=\s*$/m);
  });

  it('keeps the local database and recordings out of git', () => {
    const ignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
    expect(ignore).toMatch(/data\/\*\.db/);
    expect(ignore).toMatch(/\.env\b/);
  });
});
