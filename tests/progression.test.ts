import { describe, it, expect } from 'vitest';
import {
  nextBand,
  MIN_EVIDENCE,
  WINDOW,
  PROMOTE_AT,
  DEMOTE_AT,
  MAX_BAND,
  MIN_BAND,
} from '@/lib/progression';

/** n answers, the first `right` of them correct. */
const run = (right: number, n: number) =>
  Array.from({ length: n }, (_, i) => i < right);

describe('difficulty follows the player', () => {
  // The band used to be written once, when the prologue finished, and never
  // again. A player could learn five hundred characters and still be served the
  // band measured on their first evening.
  it('moves up when the current band has become easy', () => {
    const d = nextBand(2, run(22, 24));
    expect(d.moved).toBe('up');
    expect(d.band).toBe(3);
  });

  it('holds at the level where a staircase would sit', () => {
    // ~70% is where a measurement is sharpest and where practice is miserable:
    // wrong three times in ten, every day. Neither promote nor demote.
    const d = nextBand(3, run(17, 24));
    expect(d.moved).toBeNull();
    expect(d.band).toBe(3);
  });

  it('eases back only on sustained failure', () => {
    const d = nextBand(4, run(9, 24));
    expect(d.moved).toBe('down');
    expect(d.band).toBe(3);
  });

  it('refuses to conclude anything from a handful of answers', () => {
    // A child who gets their first four right has not earned a harder band.
    const d = nextBand(2, run(4, 4));
    expect(d.moved).toBeNull();
    expect(d.band).toBe(2);
    expect(nextBand(2, run(MIN_EVIDENCE - 1, MIN_EVIDENCE - 1)).moved).toBeNull();
  });

  it('acts as soon as there is enough evidence', () => {
    expect(nextBand(2, run(MIN_EVIDENCE, MIN_EVIDENCE)).moved).toBe('up');
  });

  it('only ever moves one band at a time', () => {
    // Even a perfect run. Jumping two bands would serve text far past the
    // coverage gate and produce a chapter he cannot read.
    expect(nextBand(1, run(24, 24)).band).toBe(2);
    expect(nextBand(7, run(0, 24)).band).toBe(6);
  });

  it('stays inside the band range', () => {
    expect(nextBand(MAX_BAND, run(24, 24)).band).toBe(MAX_BAND);
    expect(nextBand(MIN_BAND, run(0, 24)).band).toBe(MIN_BAND);
  });

  it('judges only the most recent window, so old results stop counting', () => {
    // A bad start followed by a strong month should promote.
    const old = run(0, 40);
    const recent = run(24, 24);
    expect(nextBand(2, [...old, ...recent]).moved).toBe('up');
  });

  it('promotes later than it demotes, on purpose', () => {
    // Being served something slightly too hard is uncomfortable. Being bounced
    // down after a bad evening is discouraging, and that is the child least
    // able to take it.
    expect(PROMOTE_AT).toBeGreaterThan(0.8);
    expect(DEMOTE_AT).toBeLessThan(0.5);
    expect(WINDOW).toBeGreaterThanOrEqual(MIN_EVIDENCE);
  });

  it('explains itself in words a parent can read', () => {
    expect(nextBand(2, run(22, 24)).reason).toMatch(/9[0-2]%|91%|92%/);
    expect(nextBand(2, run(2, 2)).reason).toMatch(/not enough/i);
  });
});
