import { describe, it, expect } from 'vitest';
import { VOICE_PROFILES, voiceProfile } from '@/lib/voice-profiles';

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
