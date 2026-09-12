import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CORRECT, INCORRECT, pickAffirmation, speakFeedback } from '@/lib/feedback-voice';

// sfx reads localStorage, which does not exist under the node test environment.
vi.mock('@/lib/sfx', () => ({ isSoundOn: () => soundOn }));
let soundOn = true;

beforeEach(() => {
  soundOn = true;
});

describe('spoken feedback', () => {
  it('offers several affirmations so it does not go stale', () => {
    // The prologue alone is 51 questions. The same two syllables every time
    // stops registering well before the end of it.
    expect(CORRECT.length).toBeGreaterThanOrEqual(3);
    expect(INCORRECT.length).toBeGreaterThanOrEqual(2);
  });

  it('never repeats the previous affirmation twice in a row', () => {
    let prev = '';
    for (let i = 0; i < 60; i++) {
      const a = pickAffirmation(true);
      expect(a.zh).not.toBe(prev);
      prev = a.zh;
    }
  });

  it('keeps the wrong-answer phrasing an invitation, not a verdict', () => {
    // Nothing else in this app punishes a mistake; the voice is not the
    // exception. 错了 is a verdict, 再试一次 is an invitation.
    for (const a of INCORRECT) {
      expect(a.zh).not.toMatch(/错了|不对|失败/);
    }
  });

  it('gives every affirmation pinyin and an English gloss', () => {
    for (const a of [...CORRECT, ...INCORRECT]) {
      expect(a.zh.length).toBeGreaterThan(1);
      expect(a.pinyin.trim().length).toBeGreaterThan(1);
      expect(a.en.trim().length).toBeGreaterThan(1);
    }
  });

  it('says the affirmation first, then the target', () => {
    const said: string[] = [];
    const speak = (text: string, _s?: string, cb?: { onEnd?: () => void }) => {
      said.push(text);
      cb?.onEnd?.();
    };
    const a = speakFeedback({ correct: true, target: '朋友', speak });
    expect(said).toEqual([a.zh, '朋友']);
  });

  it('still reads the target after a wrong answer', () => {
    // The wrong answer is the one that needs overwriting, so hearing the
    // right one matters more here than after a success.
    const said: string[] = [];
    const speak = (t: string, _s?: string, cb?: { onEnd?: () => void }) => {
      said.push(t);
      cb?.onEnd?.();
    };
    speakFeedback({ correct: false, target: '银行', speak });
    expect(said[1]).toBe('银行');
  });

  it('says only the affirmation when there is no target', () => {
    const said: string[] = [];
    const speak = (t: string, _s?: string, cb?: { onEnd?: () => void }) => {
      said.push(t);
      cb?.onEnd?.();
    };
    speakFeedback({ correct: true, speak });
    expect(said.length).toBe(1);
  });

  it('stays silent when the sound toggle is off, but still reports what it would have said', () => {
    soundOn = false;
    const said: string[] = [];
    const speak = (t: string) => void said.push(t);
    const a = speakFeedback({ correct: true, target: '朋友', speak });
    expect(said).toEqual([]);
    expect(a.zh).toBeTruthy();
  });

  it('calls onEnd exactly once', () => {
    let ends = 0;
    const speak = (_t: string, _s?: string, cb?: { onEnd?: () => void }) => cb?.onEnd?.();
    speakFeedback({ correct: true, target: '朋友', speak, onEnd: () => ends++ });
    expect(ends).toBe(1);
  });

  it('calls onEnd even when muted, so the caller is never left waiting', () => {
    soundOn = false;
    let ends = 0;
    speakFeedback({ correct: true, target: '朋友', speak: () => {}, onEnd: () => ends++ });
    expect(ends).toBe(1);
  });
});
