/**
 * Choosing a Chinese voice, and knowing when one is available.
 *
 * Two things about speechSynthesis bite every app that uses it, and both were
 * biting this one:
 *
 * 1. `getVoices()` returns an empty array on the first call. The list loads
 *    asynchronously and announces itself with a `voiceschanged` event. Code
 *    that calls `getVoices().find(...)` on the first utterance therefore picks
 *    no voice at all - measured on this machine: 0 voices on the first call,
 *    25 a moment later, six of them Chinese. A missing voice is not always
 *    silent, because the browser falls back to its default for the language,
 *    but on a device whose default cannot read Chinese it is either silence or
 *    an English voice attempting 汉字.
 *
 * 2. Chrome refuses to speak at all until the page has had a real user
 *    interaction, failing with `error: not-allowed`. A screen that speaks on
 *    arrival - a chapter reading itself, a listening question playing on mount
 *    - is therefore silent through no fault of its own.
 */

let pending: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * The voice list, once the browser has actually populated it.
 *
 * Resolves immediately when the list is already there. The timeout matters:
 * some platforms never fire `voiceschanged` because the list was ready before
 * the listener was attached, and waiting forever would mean never speaking.
 */
export function voicesReady(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve([]);
  if (pending) return pending;

  pending = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const now = window.speechSynthesis.getVoices();
    if (now.length) return resolve(now);

    const finish = () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(window.speechSynthesis.getVoices());
    };
    const timer = setTimeout(finish, timeoutMs);
    window.speechSynthesis.addEventListener('voiceschanged', finish);
  });

  // Not cached as a resolved value: a platform can add voices later, and the
  // promise only ever holds the first usable list. Re-reading getVoices() at
  // call time in pickVoice covers that.
  return pending;
}

/**
 * The best Chinese voice in a list, or null.
 *
 * Prefers mainland Mandarin: this is a 简体字 / 普通话 app, and a zh-TW or
 * zh-HK voice reads the same characters with the wrong pronunciation, which is
 * worse than useless for a learner being examined on Putonghua.
 */
export function pickVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const zh = voices.filter((v) => v.lang.toLowerCase().startsWith('zh'));
  if (!zh.length) return null;
  return (
    zh.find((v) => v.lang.toLowerCase().replace('_', '-') === 'zh-cn') ??
    zh.find((v) => !/tw|hk|yue/i.test(v.lang)) ??
    zh[0]
  );
}

/**
 * Whether the browser has refused to speak for want of a user gesture.
 *
 * Read by the UI so it can say "tap to turn sound on" instead of appearing
 * broken. Cleared as soon as an utterance succeeds.
 */
let blocked = false;

export function audioBlocked(): boolean {
  return blocked;
}

export function setAudioBlocked(v: boolean): void {
  blocked = v;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hq:audio-blocked', { detail: v }));
  }
}

/**
 * Unlock the speech engine on the first thing the player touches.
 *
 * Speaking inside a tap is not always possible: a listening question plays
 * itself when it appears, and a chapter reads itself aloud. Neither is a
 * gesture, and iOS refuses speech that did not start inside one - so those are
 * exactly the places that stayed silent.
 *
 * The way round it is to spend the player's first tap - on anything at all, the
 * Go button, an answer, the menu - on a zero-length utterance. It makes no
 * sound and nobody notices it, but it satisfies the platform, and everything
 * after it is allowed to speak on its own.
 *
 * Installed once, removed as soon as it has done its job.
 */
export function primeSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  let primed = false;
  const prime = () => {
    if (primed) return;
    primed = true;
    try {
      // Must be synchronous, inside the gesture. A space rather than an empty
      // string: some engines discard an empty utterance without unlocking.
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
      setAudioBlocked(false);
    } catch {
      // A platform that refuses even this cannot be unlocked here; the first
      // real utterance will report not-allowed and the UI can say so.
    }
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
      window.removeEventListener(ev, prime, true);
    }
  };

  for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(ev, prime, { capture: true, passive: true });
  }
}

/**
 * How fast to read, as a multiplier on the measured base rates.
 *
 * The defaults are set from timing the real voice and aiming at the 2 to 2.5
 * syllables per second that careful teaching speech sits at. But the right
 * speed for a particular learner on a particular day is not something a table
 * can know - and it changes as he gets better - so it is adjustable, and the
 * choice is remembered.
 *
 * "Steady" is the default rather than "Normal": the fastest setting here is
 * still slower than conversational Mandarin, and calling it normal would
 * suggest the others are remedial.
 */
export const SPEECH_SPEEDS = [
  { id: 'steady', label: '慢', en: 'Steady', factor: 1 },
  { id: 'slower', label: '更慢', en: 'Slower', factor: 0.85 },
  { id: 'brisk', label: '快些', en: 'Brisk', factor: 1.2 },
] as const;

export type SpeechSpeedId = (typeof SPEECH_SPEEDS)[number]['id'];

const SPEED_KEY = 'hq:speech-speed';

export function speechSpeed(): (typeof SPEECH_SPEEDS)[number] {
  if (typeof window === 'undefined') return SPEECH_SPEEDS[0];
  try {
    const id = window.localStorage.getItem(SPEED_KEY);
    return SPEECH_SPEEDS.find((s) => s.id === id) ?? SPEECH_SPEEDS[0];
  } catch {
    return SPEECH_SPEEDS[0];
  }
}

/** Move to the next speed and return it. */
export function cycleSpeechSpeed(): (typeof SPEECH_SPEEDS)[number] {
  const now = speechSpeed();
  const next = SPEECH_SPEEDS[(SPEECH_SPEEDS.findIndex((s) => s.id === now.id) + 1) % SPEECH_SPEEDS.length];
  try {
    window.localStorage.setItem(SPEED_KEY, next.id);
  } catch {
    // A browser refusing storage still gets the change for this session.
  }
  window.dispatchEvent(new CustomEvent('hq:speech-speed', { detail: next.id }));
  return next;
}
