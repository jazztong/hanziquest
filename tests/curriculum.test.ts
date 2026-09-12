import { describe, it, expect } from 'vitest';
import { ASSESSABLE, NOT_YET, YEAR1 } from '@/content/curriculum-year1';
import { LANGUAGE_KNOWLEDGE_ITEMS, PASSAGES } from '@/content/baseline-items';
import { POEMS } from '@/content/poems';

const items = [...LANGUAGE_KNOWLEDGE_ITEMS, ...PASSAGES.flatMap((p) => p.questions)];

const claimed = new Set<string>();
for (const it of items) {
  if (it.standardRef) claimed.add(it.standardRef);
  for (const t of it.tags) if (t.startsWith('standard:')) claimed.add(t.slice('standard:'.length));
}

describe('初一 curriculum scope', () => {
  it('transcribes the 1.x clauses of the 2016 课程标准', () => {
    // 1.1 x6, 1.2 x6, 1.3 x10, 1.4 x2, 1.5 x5, 1.6 x9
    expect(YEAR1.length).toBe(38);
    for (const c of YEAR1) expect(c.ref).toMatch(/^1\.\d+\.\d+$/);
  });

  it('serves nothing from 初二 or 初三', () => {
    // The single most important scope rule: he is in 初一. Teaching 复句 or
    // 说明文 now is teaching next year's syllabus before this year's.
    const laterRefs = new Set(NOT_YET.map((n) => n.ref));
    const leaked = [...claimed].filter((c) => {
      const base = c.split('-')[0];
      return laterRefs.has(base) || /^[23]\./.test(base);
    });
    expect(leaked).toEqual([]);
  });

  it('covers every 语文基础知识 clause and every enumerated topic', () => {
    // 1.6.x is 15% of 試卷二 and is entirely authorable without an API key, so
    // there is no excuse for a gap here. 1.6.2 and 1.6.4 are served by
    // dictionary-driven generators rather than authored items.
    const GENERATED = new Set(['1.6.2', '1.6.4']);
    const missing: string[] = [];

    for (const c of ASSESSABLE) {
      if (!c.ref.startsWith('1.6')) continue;
      if (GENERATED.has(c.ref)) continue;
      const wanted = c.topics?.length ? c.topics.map((t) => `${c.ref}-${t.key}`) : [c.ref];
      for (const w of wanted) if (!claimed.has(w)) missing.push(w);
    }
    expect(missing).toEqual([]);
  });

  it('covers all fifteen punctuation marks named in 1.6.8', () => {
    const marks = YEAR1.find((c) => c.ref === '1.6.8')!.topics!;
    expect(marks.length).toBe(15);
    for (const m of marks) {
      expect({ mark: m.key, covered: claimed.has(`1.6.8-${m.key}`) }).toEqual({
        mark: m.key,
        covered: true,
      });
    }
  });

  it('covers all twelve word classes named in 1.6.7', () => {
    const classes = YEAR1.find((c) => c.ref === '1.6.7')!.topics!;
    expect(classes.length).toBe(12);
    for (const w of classes) {
      expect({ wordClass: w.key, covered: claimed.has(`1.6.7-${w.key}`) }).toEqual({
        wordClass: w.key,
        covered: true,
      });
    }
  });

  it('covers only the five 初一 rhetorical devices, not the later ones', () => {
    const devices = YEAR1.find((c) => c.ref === '1.6.9')!.topics!.map((t) => t.key);
    expect(devices).toEqual(['比喻', '比拟', '借代', '引用', '夸张']);
    for (const d of devices) expect(claimed.has(`1.6.9-${d}`)).toBe(true);
    // 排比/反复/对偶/对比 are 3.6.4; 回文/顶真/设问/反问 are 2.6.7.
    for (const later of ['排比', '反复', '对偶', '对比', '回文', '顶真', '设问', '反问']) {
      expect(claimed.has(`1.6.9-${later}`)).toBe(false);
    }
  });

  it('tags every item with at least one 初一 clause', () => {
    for (const it of items) {
      const refs = [it.standardRef, ...it.tags.filter((t) => t.startsWith('standard:'))];
      expect({ id: it.id, hasRef: refs.some(Boolean) }).toEqual({ id: it.id, hasRef: true });
    }
  });

  it('keeps 课程标准 and 考试纲要 references apart', () => {
    // standardRef is the 课程标准 (1.x for 初一); examRef is the 考试纲要 (3.x/4.x).
    // Conflating them is what hid the comprehension coverage from the audit.
    for (const it of items) {
      if (it.standardRef) expect({ id: it.id, ref: it.standardRef }).toEqual({ id: it.id, ref: expect.stringMatching(/^1\./) });
      if (it.examRef) expect({ id: it.id, ref: it.examRef }).toEqual({ id: it.id, ref: expect.stringMatching(/^[2-5]\./) });
    }
  });

  it('unlocks exactly the four 初一 relics first', () => {
    const y1 = POEMS.filter((p) => p.year === 1);
    expect(y1.length).toBe(4);
    for (const p of y1) expect(p.book).toMatch(/^初一/);
  });
});
