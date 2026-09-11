/**
 * Claude client.
 *
 * Deliberately hand-rolled over fetch rather than pulling the SDK: the app only
 * ever makes one kind of call (a rubric-driven prompt that must come back as
 * JSON), and every call must be cached and attributable. Wrapping that in one
 * function makes both guarantees structural.
 *
 * `available()` is false when no key is set, and every caller has a non-AI path.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MODEL = 'claude-sonnet-5';
const CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'claude');

export function available(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface AskOptions {
  system: string;
  user: string;
  /** Attached images, for OCR of an uploaded 课文. */
  images?: { mediaType: string; base64: string }[];
  maxTokens?: number;
  /** Skip the cache. Only for retries after a validation failure. */
  fresh?: boolean;
  /** Recorded alongside the result so the parent can see what produced what. */
  purpose: string;
}

export interface AskResult<T> {
  data: T;
  /** The exact prompt, stored with the artefact. Required by the brief. */
  prompt: string;
  model: string;
  cached: boolean;
}

function cacheKey(o: AskOptions): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ s: o.system, u: o.user, i: o.images?.map((x) => x.base64.length) }))
    .digest('hex')
    .slice(0, 32);
}

/**
 * Ask Claude for JSON.
 *
 * `validate` runs on the parsed result. If it throws, we retry once with the
 * error fed back in - which is far more reliable than retrying blind, because
 * the usual failure is a schema slip the model can fix when told what it was.
 */
export async function askJson<T>(
  opts: AskOptions,
  validate: (raw: unknown) => T,
): Promise<AskResult<T>> {
  if (!available()) {
    throw new Error(`Claude is not configured (no ANTHROPIC_API_KEY); ${opts.purpose} needs a fallback path`);
  }

  const key = cacheKey(opts);
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  const promptRecord = `SYSTEM:\n${opts.system}\n\nUSER:\n${opts.user}`;

  if (!opts.fresh && fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return { data: validate(cached.data), prompt: cached.prompt, model: cached.model, cached: true };
  }

  let lastError = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const userContent: unknown[] = [];
    for (const img of opts.images ?? []) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
      });
    }
    userContent.push({
      type: 'text',
      text:
        attempt === 1
          ? opts.user
          : `${opts.user}\n\nYour previous reply was rejected: ${lastError}\nReturn corrected JSON only.`,
    });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        system: `${opts.system}\n\nReply with a single JSON object and nothing else. No prose, no markdown fence.`,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
      continue;
    }

    const body = (await res.json()) as { content: { type: string; text?: string }[] };
    const text = body.content.find((c) => c.type === 'text')?.text ?? '';
    const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

    try {
      const parsed = JSON.parse(json);
      const data = validate(parsed);
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(
        cacheFile,
        JSON.stringify({ data: parsed, prompt: promptRecord, model: MODEL, purpose: opts.purpose, at: new Date().toISOString() }),
      );
      return { data, prompt: promptRecord, model: MODEL, cached: false };
    } catch (err) {
      lastError = (err as Error).message.slice(0, 300);
    }
  }

  throw new Error(`${opts.purpose}: Claude did not return usable JSON (${lastError})`);
}
