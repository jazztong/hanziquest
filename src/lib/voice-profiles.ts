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

export const VOICE_PROFILES = {
  narrator: { pitch: 0.95, rate: 0.85, label: '旁白' },
  you: { pitch: 1.05, rate: 0.9, label: '你' },
  auntie: { pitch: 1.0, rate: 0.85, label: '阿姨' },
  man: { pitch: 0.85, rate: 0.85, label: '男声' },
  elder: { pitch: 0.8, rate: 0.78, label: '长者' },
  child: { pitch: 1.25, rate: 0.9, label: '小孩' },
  system: { pitch: 1.0, rate: 0.95, label: '系统' },
} as const satisfies Record<string, VoiceProfile>;

export type VoiceRole = keyof typeof VOICE_PROFILES;

export function voiceProfile(speaker: string): VoiceProfile {
  return VOICE_PROFILES[speaker as VoiceRole] ?? VOICE_PROFILES.narrator;
}
