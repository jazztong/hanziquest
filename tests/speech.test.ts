import { describe, it, expect } from 'vitest';
import { VOICE_PROFILES, rateFor, voiceProfile } from '@/lib/voice-profiles';

describe('speaking without asking the server first', () => {
  /**
   * The client used to fetch /api/tts before every single utterance, purely to
   * learn a pitch and a rate. Since the move to Cloudflare there are no
   * pre-rendered clips to discover (no filesystem), and with no Azure key the
   * response is a constant. So the round trip bought nothing and cost:
   *
   *  - ~291ms warm and 7.2s on a cold Worker, before any sound at all
   *  - silence if it failed, because the error body threw on plan.clip.cached
   *  - and on iOS, the whole utterance, because Safari only allows speech
   *    started synchronously inside the tap - an await forfeits it
   */
  it('gives every speaker a profile without a network call', () => {
    for (const role of Object.keys(VOICE_PROFILES)) {
      const p = voiceProfile(role);
      expect({ role, pitch: typeof p.pitch, rate: typeof p.rate }).toEqual({
        role,
        pitch: 'number',
        rate: 'number',
      });
    }
  });

  it('keeps the readings slow enough for a learner', () => {
    // Nothing should be read at conversational speed: this is for a 13-year-old
    // whose decoding lags his comprehension.
    for (const [role, p] of Object.entries(VOICE_PROFILES)) {
      expect({ role, ok: p.rate <= 0.95 }).toEqual({ role, ok: true });
    }
  });

  it('keeps the speakers distinguishable from one another', () => {
    // Characters have to sound different without any key configured, or every
    // line of dialogue is the same voice.
    const sigs = Object.values(VOICE_PROFILES).map((p) => `${p.pitch}/${p.rate}`);
    expect(new Set(sigs).size).toBeGreaterThanOrEqual(Object.keys(VOICE_PROFILES).length - 1);
  });

  it('falls back to the narrator for an unknown speaker', () => {
    expect(voiceProfile('nobody-by-that-name')).toEqual(VOICE_PROFILES.narrator);
  });
});

describe('reading speed', () => {
  /**
   * Timed on the deployed app with the zh-CN voice: rate 0.85 reads 2.68
   * syllables per second. Native conversational Mandarin is 5 to 5.5; careful
   * teaching speech is 2 to 2.5. These convert a rate into the measured speed
   * so the assertions are about how fast it actually sounds, not about a
   * number in a table.
   */
  const SYLL_PER_SEC_AT_1 = 2.68 / 0.85;
  const speedOf = (rate: number) => rate * SYLL_PER_SEC_AT_1;

  it('reads teaching audio inside the careful-speech band', () => {
    // `system` carries every listening question, every revealed reading and
    // every character in the breakdown. It was 0.95 - about 3.0 syllables a
    // second, faster than the story around it, which is backwards.
    const s = speedOf(VOICE_PROFILES.system.rate);
    expect({ tooFast: s > 2.5, tooSlow: s < 1.6 }).toEqual({ tooFast: false, tooSlow: false });
  });

  it('never reads anything at conversational speed', () => {
    for (const [role, p] of Object.entries(VOICE_PROFILES)) {
      const s = speedOf(p.rate);
      expect({ role, fasterThanTeaching: s > 2.5 }).toEqual({ role, fasterThanTeaching: false });
    }
  });

  it('reads the teaching voice more slowly than the story voice', () => {
    expect(VOICE_PROFILES.system.rate).toBeLessThan(VOICE_PROFILES.narrator.rate);
  });

  it('slows down for a single character', () => {
    // One syllable at conversational speed is over in a third of a second,
    // with no surrounding words to place the sound against.
    const one = rateFor(VOICE_PROFILES.system, '风');
    const sentence = rateFor(VOICE_PROFILES.system, '风吹草低见牛羊');
    expect(one).toBeLessThan(sentence);
    expect(speedOf(one)).toBeLessThan(2.0);
  });

  it('does not slow a full sentence below a plod', () => {
    const s = speedOf(rateFor(VOICE_PROFILES.narrator, '那天下午，天空忽然暗了下来。'));
    expect(s).toBeGreaterThan(1.8);
  });

  it('ignores punctuation and latin when judging length', () => {
    // "(hear it)" is not four syllables of Chinese.
    expect(rateFor(VOICE_PROFILES.system, '风')).toBe(rateFor(VOICE_PROFILES.system, '风。'));
  });
});
