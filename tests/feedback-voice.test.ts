import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CORRECT,
  INCORRECT,
  pickAffirmation,
  speakFeedback,
  speakFeedbackPaced,
  boundedAdvance,
} from '@/lib/feedback-voice';

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

describe('advancing after the verdict has been spoken', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** A speech engine that finishes after `ms`, or never if ms is null. */
  const voice = (ms: number | null) =>
    (_t: string, _s?: string, cb?: { onEnd?: () => void }) => {
      if (ms !== null) setTimeout(() => cb?.onEnd?.(), ms);
    };

  it('holds the floor when speech finishes early', () => {
    // The arcade advances 700ms after a correct answer. A one-syllable
    // affirmation must not make it advance sooner than that and feel twitchy.
    let advanced = 0;
    speakFeedbackPaced({
      correct: true,
      speak: voice(100),
      minMs: 700,
      maxMs: 2400,
      onAdvance: () => advanced++,
    });
    vi.advanceTimersByTime(699);
    expect(advanced).toBe(0);
    vi.advanceTimersByTime(2);
    expect(advanced).toBe(1);
  });

  it('waits past the floor for speech that is still going', () => {
    let advanced = 0;
    speakFeedbackPaced({
      correct: true,
      speak: voice(1500),
      minMs: 700,
      maxMs: 4000,
      onAdvance: () => advanced++,
    });
    vi.advanceTimersByTime(1400);
    expect(advanced).toBe(0);
    vi.advanceTimersByTime(200);
    expect(advanced).toBe(1);
  });

  it('advances anyway when the voice never reports finishing', () => {
    // A browser with no zh-CN voice, or a tab backgrounded mid-utterance, can
    // simply never fire onEnd. Without the ceiling the quiz would stop dead.
    let advanced = 0;
    speakFeedbackPaced({
      correct: false,
      speak: voice(null),
      minMs: 2200,
      maxMs: 4000,
      onAdvance: () => advanced++,
    });
    vi.advanceTimersByTime(3999);
    expect(advanced).toBe(0);
    vi.advanceTimersByTime(2);
    expect(advanced).toBe(1);
  });

  it('advances exactly once, however the timers fall', () => {
    let advanced = 0;
    speakFeedbackPaced({
      correct: true,
      speak: voice(50),
      minMs: 700,
      maxMs: 900,
      onAdvance: () => advanced++,
    });
    vi.advanceTimersByTime(10000);
    expect(advanced).toBe(1);
  });

  it('keeps the original pacing exactly when sound is off', () => {
    soundOn = false;
    let advanced = 0;
    speakFeedbackPaced({
      correct: true,
      speak: () => {
        throw new Error('must not speak while muted');
      },
      minMs: 1100,
      maxMs: 2600,
      onAdvance: () => advanced++,
    });
    vi.advanceTimersByTime(1099);
    expect(advanced).toBe(0);
    vi.advanceTimersByTime(2);
    expect(advanced).toBe(1);
  });
});

describe('the advance gate on its own', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not advance after it has been cancelled', () => {
    // The prologue cancels on unmount. Without this, leaving mid-question
    // fires an advance into a screen that is no longer mounted.
    let advanced = 0;
    const gate = boundedAdvance(() => advanced++, 500, 2000);
    gate.cancel();
    gate.finished();
    vi.advanceTimersByTime(10000);
    expect(advanced).toBe(0);
  });

  it('ignores a second finished() call', () => {
    let advanced = 0;
    const gate = boundedAdvance(() => advanced++, 0, 2000);
    gate.finished();
    gate.finished();
    vi.advanceTimersByTime(10000);
    expect(advanced).toBe(1);
  });

  it('still honours the floor when finished() arrives immediately', () => {
    let advanced = 0;
    const gate = boundedAdvance(() => advanced++, 800, 3000);
    gate.finished();
    vi.advanceTimersByTime(799);
    expect(advanced).toBe(0);
    vi.advanceTimersByTime(2);
    expect(advanced).toBe(1);
  });
});
