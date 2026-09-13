import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, errorLog, attempts } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { charPinyinItem, toneDiscriminateItem, listenCharItem } from '@/lib/items/generate';
import { publicItem } from '@/lib/items/public';
import { charsInBand, WORDS, CHARS, lookupChar } from '@/lib/lexicon';
import { profile } from '@/lib/player';
import type { Item } from '@/lib/items/types';
import { BadRequest, body, route } from '@/lib/api';
import { applyProgression } from '@/lib/apply-progression';

/**
 * The 拼音/声调 arcade.
 *
 * Rounds are built from the player's OWN tone confusions first, and only fall
 * back to a generic spread when there is nothing logged yet. A generic tone
 * drill is a lottery; a drill built from the pairs he actually missed last week
 * is practice. That is the entire point of writing tone slips into the error log
 * from read-aloud and from the arcade itself.
 */

const ROUND_SIZE = 12;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Characters whose tone is one of a confused pair, at or below the band. */
function charsWithTone(tone: number, band: number) {
  return CHARS.filter((c) => {
    if (c.band > band + 1) return false;
    const m = c.py[0]?.match(/[āēīōūǖ]|[áéíóúǘ]|[ǎěǐǒǔǚ]|[àèìòùǜ]/);
    if (!m) return false;
    const t = 'āēīōūǖ'.includes(m[0]) ? 1
      : 'áéíóúǘ'.includes(m[0]) ? 2
      : 'ǎěǐǒǔǚ'.includes(m[0]) ? 3
      : 4;
    return t === tone;
  });
}

export async function GET() {
  return route(async () => {
    const user = await requireStudent();
    const p = await profile(user.id);
    const band = Math.max(1, Math.min(6, p?.storyBand ?? 2));
    const monthAgo = Math.floor(Date.now() / 1000) - 30 * 86400;

    // The player's own tone confusions, most frequent first.
    const confusions = await db
      .select({ tag: errorLog.tag, n: sql<number>`count(*)` })
      .from(errorLog)
      .where(
        and(
          eq(errorLog.userId, user.id),
          eq(errorLog.skill, 'pinyinTone'),
          gte(errorLog.createdAt, monthAgo),
        ),
      )
      .groupBy(errorLog.tag)
      .orderBy(sql`count(*) desc`)
      .limit(6);

    const pairs = confusions
      .map((c) => /tone:(\d)v(\d)|tonepattern:(\d)-(\d)/.exec(c.tag))
      .filter((m): m is RegExpExecArray => Boolean(m))
      .map((m) => [Number(m[1] ?? m[3]), Number(m[2] ?? m[4])] as const)
      .filter(([a, b]) => a >= 1 && a <= 4 && b >= 1 && b <= 4 && a !== b);

    const items: Item[] = [];
    let guard = 0;
    while (items.length < ROUND_SIZE && guard++ < 400) {
      const usePair = pairs.length > 0 && items.length % 2 === 0;
      let item: Item | null = null;

      if (usePair) {
        // Drill a logged confusion: serve a character carrying one of the tones.
        const [a, b] = pick(pairs);
        const pool = charsWithTone(Math.random() < 0.5 ? a : b, band);
        if (pool.length) item = charPinyinItem(pick(pool)) ?? listenCharItem(pick(pool));
      } else {
        item =
          items.length % 3 === 0
            ? toneDiscriminateItem(
                pick(WORDS.filter((w) => w.band <= band + 1 && [...w.w].length === 2)),
              )
            : charPinyinItem(pick(charsInBand(band)));
      }

      // Dedupe on the SUBJECT, not the stem. Every tone-discriminate item shares
      // the stem 这个词的声调是什么？, so deduping by stem silently caps the round
      // at one of them - which is how a 12-question round came back with 3.
      const subject = (i: Item) => i.payload.audioText ?? i.payload.stem;
      if (item && !items.some((existing) => subject(existing) === subject(item!))) {
        items.push(item);
      }
    }

    // Personal best, from previous arcade attempts.
    const best = await db
      .select({ score: attempts.score })
      .from(attempts)
      .where(and(eq(attempts.userId, user.id), eq(attempts.context, 'arcade')))
      .orderBy(desc(attempts.score))
      .limit(1);

    return {
      // `subject` is what the client sends back for marking: the actual word or
      // character, not the display stem. Without it a tone item is unmarkable,
      // because its stem is the same generic question every time.
      items: items.map((it) => ({
        ...publicItem(it),
        subject: it.payload.audioText ?? it.payload.stem,
      })),
      roundId: `arc-${Date.now().toString(36)}`,
      targetedPairs: pairs.map(([a, b]) => `${a}v${b}`),
      personalBest: best[0]?.score ?? 0,
      band,
    };
  });
}

/**
 * Mark one arcade answer.
 *
 * The arcade serves a whole round up front, so there is no server-side round
 * state to look the item up in. Instead the client sends back the stem and the
 * TEXT of the option it chose, and we rebuild the item from the dictionary and
 * compare values. Regeneration reshuffles the options, so comparing positions
 * would be wrong; comparing the reading itself is both correct and independent
 * of ordering. The answer key still never leaves the server.
 */
export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      subject: string;
      type: 'char-pinyin' | 'tone-discriminate' | 'listen-char';
      chosen: string;
      elapsedMs: number;
    }>(req);
    if (!input.subject) throw new BadRequest('subject required');
    const user = await requireStudent();

    let item: Item | null = null;
    if (input.type === 'tone-discriminate') {
      const word = WORDS.find((w) => w.w === input.subject);
      item = word ? toneDiscriminateItem(word) : null;
    } else {
      const entry = lookupChar(input.subject);
      item = entry
        ? input.type === 'listen-char'
          ? listenCharItem(entry)
          : charPinyinItem(entry)
        : null;
    }
    if (!item) throw new BadRequest(`cannot rebuild item for "${input.subject}"`);

    // Regeneration shuffles the options, so compare by VALUE not by position.
    const chosenValue = input.chosen;
    const key = item.payload.options?.find((o) => o.id === item!.answer.correct);
    const correct =
      chosenValue === key?.pinyin || chosenValue === key?.zh || chosenValue === key?.en;

    await db.insert(attempts).values({
      userId: user.id,
      itemId: item.id,
      context: 'arcade',
      response: { chosen: chosenValue },
      correct,
      score: correct ? 1 : 0,
      elapsedMs: input.elapsedMs ?? 0,
    });

    if (!correct) {
      for (const tag of item.tags) {
        if (!tag.startsWith('tone')) continue;
        await db.insert(errorLog).values({
          userId: user.id,
          tag,
          skill: 'pinyinTone',
          detail: input.subject,
        });
      }
    }

    // The band the arcade draws from is re-checked here, not only at the end of
    // the prologue, so a player who has outgrown it stops being asked the same
    // easy characters for the rest of the year.
    const progression = await applyProgression(user.id);

    return {
      correct,
      answer: key?.pinyin ?? key?.zh ?? key?.en ?? '',
      explainEn: item.answer.explainEn ?? '',
      ...(progression?.moved ? { bandMoved: progression.moved, band: progression.band } : null),
    };
  });
}
