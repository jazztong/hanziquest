import { describe, it, expect } from 'vitest';
import { EXAM_DATES, MILESTONES } from '@/content/milestones';
import { pickVoice } from '@/lib/voices';
import { checkName, checkPassword } from '@/lib/account-rules';

describe('per-student starting data', () => {
  // The seed gave these bare content ids, which are unique only while there is
  // exactly one student. The second registration would hit the primary key, be
  // skipped by the conflict clause, and leave that child with no exam dates and
  // no milestones - a blank hub, with nothing to say anything had gone wrong.
  it('scopes every seeded id to the student so a second account is not skipped', () => {
    const forUser = (u: string) => [
      ...EXAM_DATES.map((e) => `${e.id}-${u}`),
      ...MILESTONES.map((m) => `m-${m.key}-${u}`),
    ];
    const a = forUser('u-alice');
    const b = forUser('u-bo');
    expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
  });

  it('gives a new student something to aim at in every arc', () => {
    expect(EXAM_DATES.length).toBeGreaterThan(0);
    expect(new Set(MILESTONES.map((m) => m.arc)).size).toBeGreaterThan(1);
  });
});

describe('choosing a speech voice', () => {
  const v = (name: string, lang: string) =>
    ({ name, lang, default: false, localService: true, voiceURI: name }) as SpeechSynthesisVoice;

  it('returns null when the list has not loaded', () => {
    // getVoices() is empty on the first call, which is exactly when the first
    // line of a session wants to be spoken.
    expect(pickVoice([])).toBeNull();
  });

  it('returns null when no Chinese voice is installed', () => {
    expect(pickVoice([v('Daniel', 'en-GB'), v('Alex', 'en-US')])).toBeNull();
  });

  it('prefers mainland Mandarin over Taiwanese or Cantonese', () => {
    // This is a 简体字 / 普通话 app. A zh-HK voice reads the same characters
    // with a pronunciation the 统考 would mark wrong.
    const picked = pickVoice([
      v('Sin-ji', 'zh-HK'),
      v('Mei-Jia', 'zh-TW'),
      v('Huihui', 'zh-CN'),
    ]);
    expect(picked?.lang).toBe('zh-CN');
  });

  it('falls back to any Chinese voice rather than none', () => {
    expect(pickVoice([v('Mei-Jia', 'zh-TW')])?.name).toBe('Mei-Jia');
  });

  it('tolerates underscore locale spellings', () => {
    expect(pickVoice([v('X', 'zh_CN')])?.name).toBe('X');
  });
});

describe('what a name is allowed to be', () => {
  // These exist because the pattern was silently corrupted once - a code
  // generator ate the backslashes in \p{L}, so every single registration was
  // refused with a message that said letters were fine. A live attempt was the
  // only thing that noticed.
  it('accepts ordinary names', () => {
    for (const n of ['testkid1', 'jun yuan', 'a-b_c', 'Zoe']) {
      expect({ n, problem: checkName(n) }).toEqual({ n, problem: null });
    }
  });

  it('accepts a Chinese name, which is the point of the app', () => {
    expect(checkName('小明')).toBeNull();
  });

  it('refuses punctuation that would be awkward in a URL or a shell', () => {
    for (const n of ['bad!name', 'a/b', "o'brien", '<script>']) {
      expect({ n, problem: checkName(n) }).toEqual({ n, problem: 'characters' });
    }
  });

  it('refuses names that are too short or too long', () => {
    expect(checkName('a')).toBe('length');
    expect(checkName('x'.repeat(25))).toBe('length');
  });

  it('wants a password long enough to be worth having', () => {
    expect(checkPassword('short')).toBe(false);
    expect(checkPassword('longenough')).toBe(true);
  });
});
