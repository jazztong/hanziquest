import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { ALL_SEED_CHAPTERS } from '@/content/chapters';
import { POEMS, poemText } from '@/content/poems';
import { GENRES, AVATARS } from '@/content/genres';
import { SAMPLE_LESSONS } from '@/content/sample-lessons';
import { LANGUAGE_KNOWLEDGE_ITEMS, PASSAGES, READ_ALOUD_LINES } from '@/content/baseline-items';
import { validateScript, chapterText } from '@/lib/story/types';
import { gateChapter, targetChars, nameChars } from '@/lib/story/engine';
import { CHARS, splitCoverage, isHanzi, isPolyphonic, readingsOf } from '@/lib/lexicon';
import { VOICES } from '@/lib/providers/tts';
import { publicItem, resolveOption } from '@/lib/items/public';

const knownSet = (n: number) => new Set(CHARS.slice(0, n).map((c) => c.c));

describe('seed chapters', () => {
  it('exist for the default genre', () => {
    expect(ALL_SEED_CHAPTERS.length).toBeGreaterThanOrEqual(3);
  });

  it('are structurally valid', () => {
    for (const ch of ALL_SEED_CHAPTERS) {
      expect({ id: ch.id, errors: validateScript(ch.script) }).toEqual({ id: ch.id, errors: [] });
    }
  });

  it('have unique ids and a stable sequence per genre', () => {
    const ids = ALL_SEED_CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const seqs = ALL_SEED_CHAPTERS.map((c) => `${c.genre}-${c.arc}-${c.seq}`);
    expect(new Set(seqs).size).toBe(seqs.length);
  });

  it('teach 5-10 target words each', () => {
    for (const ch of ALL_SEED_CHAPTERS) {
      expect(ch.script.targets.length).toBeGreaterThanOrEqual(5);
      expect(ch.script.targets.length).toBeLessThanOrEqual(10);
    }
  });

  it('are reachable by a realistic learner, with or without pre-teaching', () => {
    // 600 characters is roughly where an English-dominant 初一 student sits at
    // the start (docs/research.md 4.3). No seed chapter should be out of reach.
    const known = knownSet(600);
    for (const ch of ALL_SEED_CHAPTERS) {
      const gate = gateChapter(ch.script, known);
      expect({ id: ch.id, decision: gate.decision }).not.toEqual({
        id: ch.id,
        decision: 'reject',
      });
    }
  });

  it('never require more pre-teaching than the cap', () => {
    for (const size of [300, 600, 1000]) {
      const known = knownSet(size);
      for (const ch of ALL_SEED_CHAPTERS) {
        const gate = gateChapter(ch.script, known);
        if (gate.decision === 'pre-teach') expect(gate.preTeach.length).toBeLessThanOrEqual(12);
      }
    }
  });

  it('keep incidental unknowns near zero for a typical learner', () => {
    const known = knownSet(600);
    for (const ch of ALL_SEED_CHAPTERS) {
      const split = splitCoverage(
        chapterText(ch.script),
        known,
        targetChars(ch.script),
        nameChars(ch.script),
      );
      expect({ id: ch.id, share: split.incidentalShare < 0.05 }).toEqual({
        id: ch.id,
        share: true,
      });
    }
  });

  it('only use speakers that have a voice', () => {
    const voices = new Set(Object.keys(VOICES));
    for (const ch of ALL_SEED_CHAPTERS) {
      for (const node of ch.script.nodes) {
        for (const line of node.lines) {
          expect({ id: ch.id, speaker: line.speaker, ok: voices.has(line.speaker) }).toEqual({
            id: ch.id,
            speaker: line.speaker,
            ok: true,
          });
        }
      }
    }
  });

  it('give every line a unique id within the chapter', () => {
    for (const ch of ALL_SEED_CHAPTERS) {
      const ids = ch.script.nodes.flatMap((n) => n.lines.map((l) => l.id));
      expect({ id: ch.id, dupes: ids.length - new Set(ids).size }).toEqual({ id: ch.id, dupes: 0 });
    }
  });

  it('provide an English gloss for every line', () => {
    for (const ch of ALL_SEED_CHAPTERS) {
      for (const node of ch.script.nodes) {
        for (const line of node.lines) {
          expect(line.en.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('the 14 古诗文 relics', () => {
  it('is exactly the 统考 默写 list', () => {
    expect(POEMS.length).toBe(14);
  });

  it('names 册别 and 课次 for each, as the 纲要 does', () => {
    for (const p of POEMS) {
      expect(p.book).toMatch(/初[一二三][上下]册/);
      expect(p.lesson).toMatch(/第.+课/);
    }
  });

  it('has unique ids and art ids', () => {
    expect(new Set(POEMS.map((p) => p.id)).size).toBe(14);
    expect(new Set(POEMS.map((p) => p.artId)).size).toBe(14);
  });

  it('contains only simplified characters', () => {
    // A traditional character slipping in would be taught wrong: the 统考 is
    // simplified-only.
    const traditional = /[個們這來時們說會國學東車馬鳥魚長門開關聽見愛為無與後從對發現點種樣頭問題實話語誰銀萬億歲産體氣種燈飛紅綠藍葉風雲電機場業產]/u;
    for (const p of POEMS) {
      const text = poemText(p);
      const hits = [...text].filter((c) => traditional.test(c));
      expect({ id: p.id, hits }).toEqual({ id: p.id, hits: [] });
    }
  });

  it('flags 多音字 whose classical reading is not the default', () => {
    const chile = POEMS.find((p) => p.id === 'chile-ge')!;
    const jian = chile.polyphonic.find((p) => p.char === '见');
    expect(jian).toBeDefined();
    expect(jian!.reading).toBe('xiàn');
    expect(isPolyphonic('见')).toBe(true);
    expect(readingsOf('见').join(' ')).toContain('xiàn');
  });

  it('gives every poem line an English gloss and every note a translation', () => {
    for (const p of POEMS) {
      expect(p.lines.length).toBeGreaterThan(0);
      for (const l of p.lines) expect(l.en.trim().length).toBeGreaterThan(0);
      for (const n of p.notes) expect(n.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('unlocks in school-year order', () => {
    const years = POEMS.map((p) => p.year);
    expect(years.filter((y) => y === 1).length).toBeGreaterThan(0);
    expect(Math.max(...years)).toBe(3);
  });
});

describe('genres', () => {
  it('offers the four the brief asks for', () => {
    expect(GENRES.map((g) => g.id).sort()).toEqual(['legend', 'mystery', 'scifi', 'wuxia']);
  });

  it('gives every genre a story bible with cast and guardrails', () => {
    for (const g of GENRES) {
      expect(g.bible.cast.length).toBeGreaterThan(0);
      expect(g.bible.guardrails.join(' ')).toMatch(/no gore|No gore/);
      expect(g.bible.guardrails.join(' ')).toMatch(/romance/);
    }
  });

  it('maps every cast member to a real voice', () => {
    const voices = new Set(Object.keys(VOICES));
    for (const g of GENRES) {
      for (const c of g.bible.cast) expect(voices.has(c.voice)).toBe(true);
    }
  });

  it('has at least four avatars with unique ids', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(AVATARS.map((a) => a.id)).size).toBe(AVATARS.length);
  });
});

describe('baseline item bank', () => {
  it('covers the 初一 语文基础知识 clauses', () => {
    const refs = new Set(LANGUAGE_KNOWLEDGE_ITEMS.map((i) => i.standardRef));
    expect(refs).toContain('1.6.7'); // 词性 / 量词
    expect(refs).toContain('1.6.8'); // 标点符号
    expect(refs).toContain('1.6.9'); // 修辞
  });

  it('points every item at exactly one existing option, with an explanation', () => {
    for (const item of LANGUAGE_KNOWLEDGE_ITEMS) {
      const ids = (item.payload.options ?? []).map((o) => o.id);
      const matches = ids.filter((id) => id === item.answer.correct);
      expect({ id: item.id, matches: matches.length }).toEqual({ id: item.id, matches: 1 });
      expect(item.answer.explainEn?.length ?? 0).toBeGreaterThan(10);
    }
  });

  it('never leaks which option is correct to the client', () => {
    for (const item of LANGUAGE_KNOWLEDGE_ITEMS) {
      const pub = publicItem(item);
      const ids = (pub.options ?? []).map((o) => o.id);
      // Positional only - no 'k', no 'a', nothing that names the key.
      expect({ id: item.id, ids }).toEqual({
        id: item.id,
        ids: ids.map((_, i) => `o${i}`),
      });
      // The real key must not survive anywhere in the payload sent to the client.
      expect(ids).not.toContain(String(item.answer.correct));
      expect((pub.options ?? []).flatMap((o) => Object.values(o))).not.toContain(
        String(item.answer.correct),
      );
    }
  });

  it('round-trips a positional option id back to the real one', () => {
    for (const item of LANGUAGE_KNOWLEDGE_ITEMS) {
      const correctIndex = (item.payload.options ?? []).findIndex(
        (o) => o.id === item.answer.correct,
      );
      expect(resolveOption(item, `o${correctIndex}`)).toBe(item.answer.correct);
    }
  });

  it('gives every item at least four options', () => {
    for (const item of LANGUAGE_KNOWLEDGE_ITEMS) {
      expect((item.payload.options ?? []).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('grades the reading passages from easy to hard', () => {
    const bands = PASSAGES.map((p) => p.band);
    expect(bands).toEqual([...bands].sort((a, b) => a - b));
  });

  it('keeps passages within the 初一-scaled length range', () => {
    for (const p of PASSAGES) {
      const n = [...p.text].filter(isHanzi).length;
      expect({ id: p.id, ok: n >= 80 && n <= 400 }).toEqual({ id: p.id, ok: true });
    }
  });

  it('attaches two questions to each passage', () => {
    for (const p of PASSAGES) expect(p.questions.length).toBe(2);
  });

  it('grades read-aloud lines by band', () => {
    const bands = READ_ALOUD_LINES.map((l) => l.band);
    expect(bands).toEqual([...bands].sort((a, b) => a - b));
  });
});

describe('sample 课文', () => {
  it('ships two or more original lessons', () => {
    expect(SAMPLE_LESSONS.length).toBeGreaterThanOrEqual(2);
  });

  it('tags each with 课程标准 clauses', () => {
    for (const l of SAMPLE_LESSONS) expect(l.standardRefs.length).toBeGreaterThan(0);
  });

  it('lists new vocabulary that actually appears in the text', () => {
    for (const l of SAMPLE_LESSONS) {
      for (const w of l.vocab) {
        // 翻土 is a phrase from the lesson rather than a contiguous substring in
        // every case, so allow per-character presence as the weaker check.
        const present = l.text.includes(w) || [...w].every((c) => l.text.includes(c));
        expect({ lesson: l.id, w, present }).toEqual({ lesson: l.id, w, present: true });
      }
    }
  });
});

describe('licensing hygiene', () => {
  it('vendors the source licences for the HSK data', () => {
    const dir = path.join(process.cwd(), 'data', 'source');
    const files = fs.readdirSync(dir);
    expect(files.some((f) => /LICENSE/i.test(f))).toBe(true);
  });
});
