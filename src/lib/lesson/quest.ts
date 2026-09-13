/**
 * Turns an uploaded 课文 into a playable side quest.
 *
 * Everything here is generated from the dictionary and the text itself - no
 * LLM, no API key. That is a deliberate constraint, not a limitation:
 *
 *  - It works on the machine of a parent who has not configured anything.
 *  - A question built by looking a word up cannot be wrong about the word.
 *    A question written by a model can, and the student has no way to tell.
 *  - It is instant, so uploading a lesson on Sunday night produces a quest
 *    immediately rather than after a round trip.
 *
 * The lesson text stays in this app's own database. It is the parent's copy of
 * a book they bought, used for their own child's study; it is never shared and
 * never sent to anyone else. Deleting the lesson deletes everything generated from it.
 */
import {
  WORDS,
  isHanzi,
  isPolyphonic,
  lookupChar,
  lookupWord,
  pinyinOf,
  readingInContext,
  readingsOf,
  segmentReadings,
  uniqueHanzi,
  type WordEntry,
} from '../lexicon';
import type { Item } from '../items/types';

export interface LessonInput {
  id: string;
  title: string;
  bookRef: string;
  text: string;
  /** Words the parent explicitly listed, if any. */
  vocab: string[];
}

export interface PreTeachWord {
  w: string;
  pinyin: string;
  gloss: string;
  band: number | null;
  /** How many times it appears in the lesson. */
  count: number;
  /** Characters in it the student does not yet know. */
  newChars: string[];
}

export interface ReadingLine {
  id: string;
  zh: string;
  pinyin: string;
  /** Index of the paragraph this line belongs to. */
  para: number;
}

export interface LessonQuest {
  lessonId: string;
  title: string;
  bookRef: string;
  /** Stage 1: the words to meet before reading. */
  preTeach: PreTeachWord[];
  /** Stage 2: the lesson, split for karaoke reading. */
  lines: ReadingLine[];
  /** Stage 3: 统考-style questions built from this text. */
  items: Item[];
  stats: {
    chars: number;
    distinctChars: number;
    sentences: number;
    meanSentence: number;
    /** Share of characters the student already reads. */
    knownShare: number;
  };
}

let seq = 0;
const id = (p: string) => `${p}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Split into readable lines: one per sentence, keeping paragraph structure. */
export function splitLines(text: string): ReadingLine[] {
  const out: ReadingLine[] = [];
  const paras = text.split(/\n\s*\n|\n/).filter((p) => p.trim());
  paras.forEach((para, pi) => {
    // Keep the terminator on the line - it is part of how the line is read -
    // and keep any closing quote that follows it.
    //
    // Quoted speech ends 吗？”, with the mark after the full stop, so splitting
    // on 。！？ alone left the ” stranded at the head of the next line: a line
    // reading ”我点了点头 that no Chinese text would ever set that way, and a
    // punctuation question built on a quotation with one end missing.
    const parts = para.match(/[^。！？]*[。！？]+[”’」』》）]*|[^。！？]+$/g) ?? [para];
    for (const raw of parts) {
      const zh = raw.trim();
      if (!zh || ![...zh].some(isHanzi)) continue;
      out.push({ id: `L${out.length}`, zh, pinyin: pinyinOf(zh), para: pi });
    }
  });
  return out;
}

/**
 * Words worth pre-teaching.
 *
 * Parent-listed vocabulary always wins - they know what the teacher set. Beyond
 * that we take multi-character words from the lexicon that actually appear in
 * the text and sit above the student's band, ranked by how often they recur:
 * a word used five times in the lesson is worth more than one used once.
 */
export function preTeachWords(
  lesson: LessonInput,
  known: ReadonlySet<string>,
  band: number,
  limit = 12,
): PreTeachWord[] {
  const found = new Map<string, WordEntry>();

  for (const w of lesson.vocab) {
    const e = lookupWord(w);
    if (e) found.set(w, e);
  }

  for (const w of WORDS) {
    if (found.size > 200) break;
    if (w.band <= band) continue;
    if ([...w.w].length < 2) continue;
    if (!lesson.text.includes(w.w)) continue;
    found.set(w.w, w);
  }

  const scored = [...found.values()].map((w) => {
    const count = lesson.text.split(w.w).length - 1;
    const newChars = [...w.w].filter((c) => isHanzi(c) && !known.has(c));
    return {
      w: w.w,
      pinyin: pinyinOf(w.w),
      gloss: w.gloss,
      band: w.band,
      count,
      newChars,
    };
  });

  return scored
    .sort((a, b) => b.newChars.length - a.newChars.length || b.count - a.count || a.band! - b.band!)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Question generation, all from the text
// ---------------------------------------------------------------------------

/**
 * 词语 in context: blank a word, choose which one fits.
 *
 * Distractors are drawn from words of the same length and a nearby band that do
 * NOT appear in this lesson. Same-length matters: a one-character option next to
 * three two-character options is answerable without reading anything.
 */
function clozeItems(lesson: LessonInput, targets: PreTeachWord[], lines: ReadingLine[]): Item[] {
  const out: Item[] = [];

  for (const t of targets.slice(0, 6)) {
    const line = lines.find((l) => l.zh.includes(t.w));
    if (!line) continue;

    const len = [...t.w].length;
    const pool = WORDS.filter(
      (w) =>
        [...w.w].length === len &&
        w.w !== t.w &&
        Math.abs(w.band - (t.band ?? 3)) <= 1 &&
        !lesson.text.includes(w.w),
    );
    if (pool.length < 3) continue;

    const distractors = shuffle(pool).slice(0, 3);
    const options = shuffle([
      { id: 'k', zh: t.w },
      ...distractors.map((d, i) => ({ id: `d${i}`, zh: d.w })),
    ]);

    out.push({
      id: id('lz'),
      type: 'cloze',
      skill: 'vocabulary',
      band: t.band ?? 3,
      year: 1,
      standardRef: '1.6.5',
      payload: {
        stem: line.zh.replace(t.w, '（　）'),
        stemEn: 'Which word belongs in the gap?',
        options,
        hintEn: `It appears ${t.count}× in this lesson.`,
      },
      answer: {
        correct: 'k',
        explainEn: `${t.w} (${t.pinyin}) — ${t.gloss}`,
        explainZh: `原句：${line.zh}`,
        sourceLine: line.zh,
      },
      source: 'lesson',
      tags: [`word:${t.w}`, `lesson:${lesson.id}`],
    });
  }
  return out;
}

/** 多音字 actually present in this lesson, asked in their own sentence. */
function polyphoneItems(lesson: LessonInput, lines: ReadingLine[]): Item[] {
  const out: Item[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const chars = [...line.zh];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (!isHanzi(ch) || seen.has(ch) || !isPolyphonic(ch)) continue;

      const correct = readingInContext(line.zh, i);
      const others = readingsOf(ch).filter((r) => r !== correct);
      if (!correct || others.length === 0) continue;
      seen.add(ch);

      const marked = chars.slice(0, i).join('') + `【${ch}】` + chars.slice(i + 1).join('');
      out.push({
        id: id('lp'),
        type: 'polyphone',
        skill: 'languageKnowledge',
        band: lookupChar(ch)?.band ?? 3,
        year: 1,
        standardRef: '1.6.4',
        payload: {
          stem: marked,
          stemEn: `In this sentence from the lesson, how is 【${ch}】 read?`,
          audioText: line.zh,
          options: shuffle([
            { id: 'k', pinyin: correct },
            ...others.slice(0, 3).map((r, n) => ({ id: `d${n}`, pinyin: r })),
          ]),
          hintEn: `${ch} has ${others.length + 1} readings. The sentence decides.`,
        },
        answer: {
          correct: 'k',
          explainEn: `Here it is ${correct}. Its other readings (${others.join(', ')}) belong to other words.`,
          explainZh: `“${ch}”是多音字，在本句中读 ${correct}。`,
        },
        source: 'lesson',
        tags: [`polyphone:${ch}`, 'standard:1.6.4', `lesson:${lesson.id}`],
      });
      if (out.length >= 3) return out;
    }
  }
  return out;
}

/** 标点符号: blank a mark, choose it. 课程标准 1.6.8. */
function punctuationItems(lesson: LessonInput, lines: ReadingLine[]): Item[] {
  const MARKS = ['，', '。', '、', '：', '；', '？', '！'];
  const out: Item[] = [];

  for (const line of lines) {
    if (out.length >= 2) break;
    if ([...line.zh].filter(isHanzi).length < 8) continue;

    const positions = [...line.zh]
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => MARKS.includes(c) && i > 2 && i < line.zh.length - 1);
    if (!positions.length) continue;

    const { c, i } = positions[Math.floor(positions.length / 2)];
    const distractors = shuffle(MARKS.filter((m) => m !== c)).slice(0, 3);

    out.push({
      id: id('lu'),
      type: 'punctuation',
      skill: 'languageKnowledge',
      band: 2,
      year: 1,
      standardRef: '1.6.8',
      payload: {
        stem: line.zh.slice(0, i) + '（　）' + line.zh.slice(i + 1),
        stemEn: 'Which punctuation mark did the lesson use here?',
        options: shuffle([
          { id: 'k', zh: c },
          ...distractors.map((d, n) => ({ id: `d${n}`, zh: d })),
        ]),
      },
      answer: {
        correct: 'k',
        explainZh: `原句：${line.zh}`,
        explainEn: 'Check the original line.',
        sourceLine: line.zh,
      },
      source: 'lesson',
      tags: ['standard:1.6.8-标点', `lesson:${lesson.id}`],
    });
  }
  return out;
}

/**
 * 顺序: put three consecutive lines back in order.
 *
 * This is the closest deterministic proxy for the 统考's 文本思路 questions
 * (顺叙/倒叙/插叙, 时间/空间/逻辑顺序). It cannot be answered without having
 * understood what the passage is doing, which is the point.
 */
function sequenceItem(lesson: LessonInput, lines: ReadingLine[]): Item[] {
  const run = lines.filter((l) => [...l.zh].filter(isHanzi).length >= 6).slice(0, 3);
  if (run.length < 3) return [];

  const correct = run.map((l) => l.zh);
  const shown = shuffle(correct);
  if (shown.join('') === correct.join('')) shown.reverse();

  return [
    {
      id: id('lq'),
      type: 'comprehension',
      skill: 'comprehension',
      band: 3,
      year: 1,
      standardRef: '4.3.2',
      payload: {
        stem: shown.map((s, i) => `${'ABC'[i]}. ${s}`).join('\n'),
        stemEn: 'Put these three lines back into the order the lesson uses.',
        options: shuffle(
          [
            correct.map((c) => 'ABC'[shown.indexOf(c)]).join(' → '),
            ['A → C → B', 'C → B → A', 'B → A → C'].filter(
              (x) => x !== correct.map((c) => 'ABC'[shown.indexOf(c)]).join(' → '),
            )[0],
            ['C → A → B', 'B → C → A', 'A → B → C'].filter(
              (x) => x !== correct.map((c) => 'ABC'[shown.indexOf(c)]).join(' → '),
            )[0],
          ]
            .filter(Boolean)
            .map((zh, i) => ({ id: i === 0 ? 'k' : `d${i}`, en: zh as string })),
        ),
      },
      answer: {
        correct: 'k',
        explainZh: `原文顺序：${correct.join('')}`,
        explainEn: 'Order in the lesson, top to bottom.',
      },
      source: 'lesson',
      tags: ['comprehension:文本思路', `lesson:${lesson.id}`],
    },
  ];
}

// ---------------------------------------------------------------------------

export function buildQuest(
  lesson: LessonInput,
  known: ReadonlySet<string>,
  band: number,
): LessonQuest {
  const lines = splitLines(lesson.text);
  const preTeach = preTeachWords(lesson, known, band);

  const chars = [...lesson.text].filter(isHanzi);
  const distinct = uniqueHanzi(lesson.text);
  const sentLens = lines.map((l) => [...l.zh].filter(isHanzi).length);

  const items = [
    ...clozeItems(lesson, preTeach, lines),
    ...polyphoneItems(lesson, lines),
    ...punctuationItems(lesson, lines),
    ...sequenceItem(lesson, lines),
  ];

  return {
    lessonId: lesson.id,
    title: lesson.title,
    bookRef: lesson.bookRef,
    preTeach,
    lines,
    items,
    stats: {
      chars: chars.length,
      distinctChars: distinct.length,
      sentences: lines.length,
      meanSentence: sentLens.length
        ? Math.round((sentLens.reduce((a, b) => a + b, 0) / sentLens.length) * 10) / 10
        : 0,
      knownShare: chars.length
        ? Math.round((chars.filter((c) => known.has(c)).length / chars.length) * 1000) / 1000
        : 1,
    },
  };
}

export { segmentReadings };
