import { describe, it, expect } from 'vitest';
import {
  Rating,
  State,
  newCardState,
  schedule,
  gradeFrom,
  cardLevelFromStability,
  isKnown,
  pickReviewQueue,
  type QueueCandidate,
} from '@/lib/srs';

describe('FSRS scheduling', () => {
  it('starts a card as new and due now', () => {
    const s = newCardState(new Date('2026-09-12T00:00:00Z'));
    expect(s.state).toBe(State.New);
    expect(s.reps).toBe(0);
  });

  it('pushes the due date further out for Easy than for Hard', () => {
    const base = newCardState(new Date('2026-09-12T00:00:00Z'));
    const now = new Date('2026-09-12T00:00:00Z');
    const hard = schedule(base, Rating.Hard, now);
    const easy = schedule(base, Rating.Easy, now);
    expect(easy.due).toBeGreaterThan(hard.due);
  });

  it('records a lapse when a review card is failed', () => {
    let s = newCardState(new Date('2026-09-12T00:00:00Z'));
    s = schedule(s, Rating.Easy, new Date('2026-09-12T00:00:00Z'));
    s = schedule(s, Rating.Good, new Date('2026-09-20T00:00:00Z'));
    const before = s.lapses;
    s = schedule(s, Rating.Again, new Date('2026-10-01T00:00:00Z'));
    expect(s.lapses).toBe(before + 1);
  });

  it('increases stability across successful reviews', () => {
    let s = newCardState(new Date('2026-01-01T00:00:00Z'));
    s = schedule(s, Rating.Good, new Date('2026-01-01T00:00:00Z'));
    const first = s.stability;
    s = schedule(s, Rating.Good, new Date('2026-01-05T00:00:00Z'));
    expect(s.stability).toBeGreaterThan(first);
  });
});

describe('grading from a mechanic result', () => {
  it('always returns Again for a wrong answer', () => {
    expect(gradeFrom({ mode: 'recognise', correct: false, elapsedMs: 100 })).toBe(Rating.Again);
    expect(gradeFrom({ mode: 'write', correct: false, elapsedMs: 100, quality: 1 })).toBe(
      Rating.Again,
    );
  });

  it('downgrades a hinted answer to Hard', () => {
    expect(
      gradeFrom({ mode: 'recognise', correct: true, elapsedMs: 200, usedHint: true }),
    ).toBe(Rating.Hard);
  });

  it('treats slow-but-right recognition as Hard', () => {
    expect(gradeFrom({ mode: 'recognise', correct: true, elapsedMs: 9000 })).toBe(Rating.Hard);
  });

  it('gives Easy only to fast, high-quality answers', () => {
    expect(gradeFrom({ mode: 'recognise', correct: true, elapsedMs: 400, quality: 1 })).toBe(
      Rating.Easy,
    );
    expect(gradeFrom({ mode: 'recognise', correct: true, elapsedMs: 400, quality: 0.85 })).not.toBe(
      Rating.Easy,
    );
  });

  it('uses a more generous clock for writing than for recognition', () => {
    // 8 seconds is slow for recognition but normal for writing a character.
    expect(gradeFrom({ mode: 'recognise', correct: true, elapsedMs: 8000 })).toBe(Rating.Hard);
    expect(gradeFrom({ mode: 'write', correct: true, elapsedMs: 8000 })).toBe(Rating.Good);
  });

  it('fails a technically-correct answer with poor stroke quality', () => {
    expect(gradeFrom({ mode: 'write', correct: true, elapsedMs: 5000, quality: 0.4 })).toBe(
      Rating.Again,
    );
  });
});

describe('card level', () => {
  it('rises with stability, not with repetition count', () => {
    expect(cardLevelFromStability(0.2)).toBe(1);
    expect(cardLevelFromStability(3)).toBe(2);
    expect(cardLevelFromStability(10)).toBe(3);
    expect(cardLevelFromStability(30)).toBe(4);
    expect(cardLevelFromStability(90)).toBe(5);
  });
});

describe('known-for-coverage', () => {
  it('does not count a brand-new card as known', () => {
    expect(isKnown({ ...newCardState(), state: State.New, stability: 0 })).toBe(false);
  });

  it('does not count a first-exposure learning card as known', () => {
    expect(isKnown({ ...newCardState(), state: State.Learning, stability: 5 })).toBe(false);
  });

  it('counts a review card that has survived a gap', () => {
    expect(isKnown({ ...newCardState(), state: State.Review, stability: 4 })).toBe(true);
  });
});

describe('queue building', () => {
  const now = 1_000_000;
  const make = (n: number, state: number, dueOffset: number): QueueCandidate[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `c${state}-${i}`,
      value: String(i),
      due: now + dueOffset,
      state,
      stability: 1,
    }));

  it('caps the session rather than handing back the whole backlog', () => {
    const q = pickReviewQueue(make(200, State.Review, -100), { now, limit: 30, newLimit: 5 });
    expect(q.cards.length).toBeLessThanOrEqual(30);
    expect(q.dueTotal).toBe(200);
    expect(q.deferred).toBeGreaterThan(0);
  });

  it('never counts not-yet-due cards as due', () => {
    const q = pickReviewQueue(make(10, State.Review, 86400), { now, limit: 30 });
    expect(q.dueTotal).toBe(0);
  });

  it('mixes new cards in rather than appending them at the end', () => {
    const q = pickReviewQueue(
      [...make(20, State.Review, -100), ...make(5, State.New, 0)],
      { now, limit: 25, newLimit: 5 },
    );
    const newIndexes = q.cards
      .map((c, i) => (c.state === State.New ? i : -1))
      .filter((i) => i >= 0);
    expect(newIndexes.length).toBe(5);
    // If they were appended, the first new card would be at index >= 20.
    expect(newIndexes[0]).toBeLessThan(10);
  });

  it('puts boosted cards first', () => {
    const cards: QueueCandidate[] = [
      { id: 'a', value: 'a', due: now - 5000, state: State.Review, stability: 1 },
      { id: 'b', value: 'b', due: now - 10, state: State.Review, stability: 1, boost: 5 },
    ];
    const q = pickReviewQueue(cards, { now, limit: 10, newLimit: 0 });
    expect(q.cards[0].id).toBe('b');
  });

  it('returns an empty queue when nothing is due and nothing is new', () => {
    const q = pickReviewQueue(make(10, State.Review, 86400), { now, limit: 30 });
    expect(q.cards).toEqual([]);
  });
});
