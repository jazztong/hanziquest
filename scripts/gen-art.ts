/**
 * Build-time art generation via the locally installed OpenAI Codex CLI.
 *
 * Codex has no image subcommand and `codex exec` returns text, not bytes. What
 * it does have is a built-in image generation tool plus a shell, so the workflow
 * is: tell it to generate the image AND save it to an exact absolute path, then
 * verify the file ourselves. We never trust the agent's report - it is perfectly
 * capable of saying "saved" when it did not.
 *
 *   npm run gen-art                 generate everything still pending
 *   npm run gen-art -- --force id   regenerate one entry
 *   npm run gen-art -- --only scene regenerate by type
 *   npm run gen-art -- --dry-run    print the assembled prompts, generate nothing
 *   npm run gen-art -- --limit 5    stop after N generations (plan-limit friendly)
 *
 * Auth lives on the developer's machine (`codex login`). Nothing here runs on a
 * server: chapters created at runtime get a `pending` manifest entry and the app
 * falls back to the nearest existing scene until this script is run again.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

/**
 * Run a command with arguments as an array and stdin closed.
 *
 * spawn, not exec: no shell is involved, so a multi-paragraph art prompt can
 * never be interpreted as shell syntax.
 *
 * stdin MUST be 'ignore'. `codex exec` appends piped stdin to the prompt, so an
 * open-but-empty stdin pipe - which is what execFile leaves behind - makes it
 * wait for EOF forever. That turned a 60-second image into a 12-minute timeout,
 * silently, for every single entry.
 */
function run(
  cmd: string,
  args: string[],
  opts: { timeout?: number } = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = opts.timeout
      ? setTimeout(() => {
          if (settled) return;
          settled = true;
          child.kill();
          reject(new Error(`timed out after ${Math.round(opts.timeout! / 1000)}s`));
        }, opts.timeout)
      : null;

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`exit ${code}: ${stderr.slice(-500) || stdout.slice(-500)}`));
    });
  });
}

/**
 * Resolve how to invoke Codex.
 *
 * On Windows the `codex` on PATH is a .cmd shim, which execFile cannot run
 * without a shell - and turning the shell on would mean interpolating a
 * multi-paragraph art prompt into a command string, which is exactly the thing
 * not to do. Both shims ultimately run
 *   node <prefix>/node_modules/@openai/codex/bin/codex.js
 * so we find that script and run it with the current Node binary. Arguments stay
 * an array, no shell is involved, and it behaves identically on every platform.
 */
function resolveCodex(): { cmd: string; prefix: string[] } | null {
  const candidates: string[] = [];
  const fromPath = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  for (const dir of fromPath) {
    candidates.push(path.join(dir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js'));
  }
  candidates.push(
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js'),
    '/usr/local/lib/node_modules/@openai/codex/bin/codex.js',
    '/usr/lib/node_modules/@openai/codex/bin/codex.js',
  );

  for (const c of candidates) {
    if (fs.existsSync(c)) return { cmd: process.execPath, prefix: [c] };
  }
  // POSIX: the plain `codex` shim is executable, so execFile can run it directly.
  if (process.platform !== 'win32') return { cmd: 'codex', prefix: [] };
  return null;
}

const CODEX = resolveCodex();

/** Tail of the last Codex run, surfaced when generation fails. */
let lastCodexOutput = '';

async function codex(args: string[], opts: { timeout?: number } = {}) {
  if (!CODEX) throw new Error('codex entry point not found');
  return run(CODEX.cmd, [...CODEX.prefix, ...args], opts);
}

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'art', 'manifest.json');
const STYLE = path.join(ROOT, 'art', 'style.md');
const OUT_DIR = path.join(ROOT, 'art', 'out');
const WEB_DIR = path.join(ROOT, 'public', 'art');

/** Delay between Codex calls. Plan limits are per-minute; this keeps us under. */
const DELAY_MS = 4000;
/** WebP widths emitted for every asset, capped at the source width. */
const WEB_WIDTHS = [1536, 768, 384];

export type ArtType =
  | 'character'
  | 'scene'
  | 'card'
  | 'map'
  | 'avatar'
  | 'relic'
  | 'boss'
  | 'ui';

export type ArtStatus = 'pending' | 'done' | 'failed' | 'placeholder';

export interface ArtEntry {
  id: string;
  type: ArtType;
  /** mystery | scifi | wuxia | legend | null for genre-neutral assets. */
  genre: string | null;
  /** The shot description. Style words belong in art/style.md, not here. */
  prompt: string;
  size: string;
  /** Output path relative to the repo root, always under art/out/. */
  out: string;
  /** ids of `character` entries whose description is appended to the prompt. */
  refs?: string[];
  /** For `character` entries: the canonical design description reused by scenes. */
  description?: string;
  status: ArtStatus;
  /** What was actually sent, recorded for reproducibility and parent review. */
  lastPrompt?: string;
  generatedAt?: string;
  bytes?: number;
  error?: string;
  /** Generated WebP paths, relative to public/. */
  web?: string[];
  /** Set when this entry was created at runtime by a generated chapter. */
  createdBy?: string;
  /** Closest existing asset to show while this is pending. */
  fallback?: string;
}

export interface Manifest {
  version: number;
  entries: ArtEntry[];
}

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

/** Pulled out of art/style.md so the guide stays the single source of truth. */
function extractSection(md: string, heading: string): string {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.trim().toLowerCase().startsWith(heading.toLowerCase()));
  if (start === -1) return '';
  const level = (lines[start].match(/^#+/) ?? ['#'])[0].length;
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^#+/);
    if (m && m[0].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}

function blockquoteText(md: string): string {
  return md
    .split('\n')
    .filter((l) => l.trim().startsWith('>'))
    .map((l) => l.replace(/^\s*>\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const GENRE_HEADINGS: Record<string, string> = {
  mystery: '### `mystery`',
  scifi: '### `scifi`',
  wuxia: '### `wuxia`',
  legend: '### `legend`',
};

export function buildPrompt(entry: ArtEntry, manifest: Manifest, styleMd: string): string {
  const globalStyle = blockquoteText(extractSection(styleMd, '## 2. Global style'));
  const parts: string[] = [globalStyle];

  if (entry.genre && GENRE_HEADINGS[entry.genre]) {
    const g = extractSection(styleMd, GENRE_HEADINGS[entry.genre])
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    parts.push(`Genre direction: ${g}`);
  }

  for (const refId of entry.refs ?? []) {
    const ref = manifest.entries.find((e) => e.id === refId);
    if (!ref) throw new Error(`${entry.id}: refs unknown entry "${refId}"`);
    if (ref.status !== 'done') {
      throw new Error(
        `${entry.id}: character sheet "${refId}" is ${ref.status}; generate sheets before scenes`,
      );
    }
    if (!ref.description) throw new Error(`${entry.id}: ref "${refId}" has no description`);
    parts.push(`Character appearing in this shot - keep exactly consistent: ${ref.description}`);
  }

  parts.push(`Shot: ${entry.prompt}`);
  parts.push(
    'Absolutely no text, letters, Chinese characters, numerals, signage, labels, logos, captions or watermarks anywhere in the image. Any surface that would normally carry writing must be blank, abstracted or turned away.',
  );
  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function codexGenerate(prompt: string, absOut: string, size: string): Promise<void> {
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  if (fs.existsSync(absOut)) fs.rmSync(absOut);

  const instruction = [
    'Use your built-in image generation tool to create ONE image from the',
    `art direction below, at ${size} pixels.`,
    '',
    'Then save the generated PNG to this EXACT absolute path, creating parent',
    'directories if needed, and print the file size:',
    `  ${absOut}`,
    '',
    'Do not ask any questions. Do not write any other files. Do not add text to',
    'the image.',
    '',
    '--- ART DIRECTION ---',
    prompt,
  ].join('\n');

  // No writable_roots override. Codex stages the generated image under
  // ~/.codex/generated_images before copying it to the target, so narrowing the
  // writable roots to art/out silently breaks generation - the model produces
  // the image and then has nowhere to put it. The default workspace-write root
  // is the repo, and art/out lives inside it.
  const { stdout, stderr } = await codex(
    ['exec', '--sandbox', 'workspace-write', '--skip-git-repo-check', instruction],
    { timeout: 5 * 60 * 1000 },
  );
  lastCodexOutput = `${stdout}\n${stderr}`.slice(-2000);
}

/** PNG magic bytes. A zero-byte or HTML-error file must never reach the app. */
function isValidPng(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  const stat = fs.statSync(file);
  if (stat.size < 1024) return false;
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(8);
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);
  return buf.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

async function toWebp(absPng: string, id: string): Promise<string[]> {
  const meta = await sharp(absPng).metadata();
  const srcWidth = meta.width ?? 1024;
  const out: string[] = [];
  fs.mkdirSync(WEB_DIR, { recursive: true });
  for (const w of WEB_WIDTHS) {
    if (w > srcWidth && w !== WEB_WIDTHS[WEB_WIDTHS.length - 1]) continue;
    const width = Math.min(w, srcWidth);
    const name = `${id}-${width}.webp`;
    await sharp(absPng).resize({ width }).webp({ quality: 82 }).toFile(path.join(WEB_DIR, name));
    out.push(`art/${name}`);
  }
  return [...new Set(out)];
}

/** A visibly-placeholder tile, so a missing asset is obvious rather than broken. */
async function writePlaceholder(entry: ArtEntry, absOut: string): Promise<void> {
  const [w, h] = entry.size.split('x').map(Number);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#F7F1E3"/>
    <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" stroke="#48596B" stroke-width="6" stroke-dasharray="24 16"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 6}" fill="#1F8A80" opacity="0.35"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(absOut);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadManifest(): Manifest {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Manifest;
}

function saveManifest(m: Manifest) {
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const force = arg('--force');
  const only = arg('--only');
  const limitRaw = arg('--limit');
  const limit = limitRaw ? Number(limitRaw) : Infinity;
  const dryRun = process.argv.includes('--dry-run');
  const usePlaceholders = process.argv.includes('--placeholders');

  const manifest = loadManifest();
  const styleMd = fs.readFileSync(STYLE, 'utf8');

  // Character sheets first, unconditionally: scenes reference their descriptions
  // and buildPrompt refuses to run if a referenced sheet is not `done`.
  const order: ArtType[] = ['character', 'avatar', 'ui', 'card', 'map', 'relic', 'boss', 'scene'];
  const queue = manifest.entries
    .filter((e) => (force ? e.id === force : e.status !== 'done'))
    .filter((e) => (only ? e.type === only : true))
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

  if (!queue.length) {
    console.log('nothing to generate - all manifest entries are done');
    return;
  }

  if (!dryRun && !usePlaceholders) {
    try {
      const { stdout } = await codex(['--version'], { timeout: 30_000 });
      console.log(`using ${stdout.trim()}`);
    } catch (err) {
      console.error(
        [
          `Codex CLI not usable (${(err as Error).message}).`,
          'Install it and run `codex login`, or re-run with --placeholders to fill',
          'the manifest with visible placeholder tiles and carry on without art.',
        ].join('\n'),
      );
      process.exit(1);
    }
  }

  console.log(`${queue.length} entries queued (limit ${limit})`);
  let done = 0;
  let failed = 0;

  for (const entry of queue) {
    if (done >= limit) {
      console.log(`--limit ${limit} reached; ${queue.length - done - failed} entries still pending`);
      break;
    }

    let prompt: string;
    try {
      prompt = buildPrompt(entry, manifest, styleMd);
    } catch (err) {
      console.error(`SKIP ${entry.id}: ${(err as Error).message}`);
      failed++;
      continue;
    }

    if (dryRun) {
      console.log(`\n===== ${entry.id} (${entry.type}, ${entry.size}) =====\n${prompt}\n`);
      continue;
    }

    const absOut = path.join(ROOT, entry.out);

    if (usePlaceholders) {
      await writePlaceholder(entry, absOut);
      entry.status = 'placeholder';
      entry.lastPrompt = prompt;
      entry.generatedAt = new Date().toISOString();
      entry.web = await toWebp(absOut, entry.id);
      saveManifest(manifest);
      console.log(`PLACEHOLDER ${entry.id}`);
      done++;
      continue;
    }

    // One retry, as specified, then placeholder.
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      process.stdout.write(`  ${entry.id} (${entry.type}) attempt ${attempt}... `);
      try {
        await codexGenerate(prompt, absOut, entry.size);
        ok = isValidPng(absOut);
        console.log(ok ? 'ok' : 'no valid PNG at target path');
      } catch (err) {
        console.log(`error: ${(err as Error).message.split('\n')[0]}`);
      }
      if (!ok && attempt === 1) await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    entry.lastPrompt = prompt;
    entry.generatedAt = new Date().toISOString();

    if (ok) {
      entry.status = 'done';
      entry.bytes = fs.statSync(absOut).size;
      entry.error = undefined;
      entry.web = await toWebp(absOut, entry.id);
      done++;
    } else {
      await writePlaceholder(entry, absOut);
      entry.status = 'failed';
      entry.error = `codex produced no valid PNG after 2 attempts; placeholder written. Tail: ${lastCodexOutput.replace(/\s+/g, ' ').slice(-400)}`;
      entry.web = await toWebp(absOut, entry.id);
      failed++;
    }
    saveManifest(manifest);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const remaining = loadManifest().entries.filter((e) => e.status !== 'done').length;
  console.log(`\ngenerated ${done}, failed ${failed}, still not done ${remaining}`);
}

if (process.argv[1] && process.argv[1].includes('gen-art')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
