/**
 * How each speaker sounds in the browser's own synthesiser.
 *
 * Pure data with no server imports, so the client can read it directly. It
 * used to live only in providers/tts.ts, which imports node:crypto and
 * therefore cannot be loaded in a browser - so the page fetched /api/tts before
 * every utterance just to be told these two numbers.
 *
 * That round trip is why the app went quiet. It bought nothing (there are no
 * pre-rendered clips on Cloudflare, and no Azure key means no better voice) and
 * it cost the one thing speech cannot afford: an await between the tap and the
 * speaking. iOS Safari only permits speech started synchronously inside a user
 * gesture, so on a phone the await forfeited the utterance entirely.
 */

export interface VoiceProfile {
  /** 1 is the synthesiser's normal pitch. */
  pitch: number;
  /** Below 1 is slower than conversational, which is the point. */
  rate: number;
  label: string;
}

/**
 * Rates chosen from measurement, not by feel.
 *
 * Timed on the deployed app with the zh-CN voice: rate 0.85 reads 2.68
 * syllables per second, so a character takes about 373ms. Native conversational
 * Mandarin runs at roughly 5 to 5.5 syllables per second; careful teaching
 * speech sits at about 2 to 2.5.
 *
 * Every rate here was above that band, and the worst offender was `system` at
 * 0.95 - 3.0 syllables per second - which is the voice used for every listening
 * question, every reading revealed after an answer, and every character in the
 * breakdown. The audio he is meant to learn from was the fastest in the app and
 * faster than the story around it, which is backwards.
 */
export const VOICE_PROFILES = {
  narrator: { pitch: 0.95, rate: 0.75, label: '旁白' },
  you: { pitch: 1.05, rate: 0.78, label: '你' },
  auntie: { pitch: 1.0, rate: 0.75, label: '阿姨' },
  man: { pitch: 0.85, rate: 0.75, label: '男声' },
  elder: { pitch: 0.8, rate: 0.68, label: '长者' },
  // Distinguished by its high pitch, so the rate can sit in the band too.
  child: { pitch: 1.25, rate: 0.77, label: '小孩' },
  // The slowest in the app, because it carries the teaching.
  system: { pitch: 1.0, rate: 0.65, label: '系统' },
} as const satisfies Record<string, VoiceProfile>;

export type VoiceRole = keyof typeof VOICE_PROFILES;

export function voiceProfile(speaker: string): VoiceProfile {
  return VOICE_PROFILES[speaker as VoiceRole] ?? VOICE_PROFILES.narrator;
}

/**
 * Short text is read more slowly than long text.
 *
 * A single character at a conversational rate is over in about a third of a
 * second - gone before attention has landed on it, with no surrounding words to
 * help place the sound. A sentence carries its own context and can move at the
 * profile's rate.
 *
 * This matters most exactly where the app teaches: the Wall of Names asks about
 * one character, and the reveal after an answer reads one word.
 */
export function rateFor(profile: VoiceProfile, text: string): number {
  const syllables = [...text].filter((c) => /\p{Script=Han}/u.test(c)).length;
  if (syllables === 0) return profile.rate;
  if (syllables === 1) return round2(profile.rate * 0.8);
  if (syllables <= 3) return round2(profile.rate * 0.9);
  return profile.rate;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
