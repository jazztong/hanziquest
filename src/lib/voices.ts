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
