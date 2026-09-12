'use client';

/**
 * Interface sound.
 *
 * Every sound is synthesised with the Web Audio API rather than loaded from a
 * file. Three reasons that matters here:
 *
 *  - Nothing to download, so feedback is instantaneous even on the first play
 *    and on a bad connection. A 40ms delay on a "correct" chime makes the whole
 *    app feel laggy.
 *  - Nothing to license, and nothing to ship in the repo.
 *  - It works offline, which the PWA story needs.
 *
 * Design rules, taken from how the rest of the app treats failure:
 *  - `wrong` is a soft, low, short tone. Not a buzzer. Getting something wrong
 *    already costs the player time and a detour; making it sound like a game
 *    show klaxon is the loss-framing the whole design avoids.
 *  - `correct` is brighter and shorter than `wrong` is long, so the app feels
 *    encouraging on average rather than nagging.
 *  - Everything is quiet. This is a thing a 13-year-old plays on a sofa with
 *    someone else in the room.
 */

type Voice = {
  /** Frequencies in Hz, played in sequence. */
  notes: number[];
  /** Seconds per note. */
  dur: number;
  type: OscillatorType;
  /** Peak gain, 0-1. Kept low deliberately. */
  gain: number;
  /** Seconds between note onsets; defaults to `dur`. */
  step?: number;
  /** Slide to the next note rather than stepping. */
  glide?: boolean;
};

export type SfxName =
  | 'correct'
  | 'wrong'
  | 'levelUp'
  | 'cardFlip'
  | 'reveal'
  | 'select'
  | 'page'
  | 'streak'
  | 'tick'
  | 'unlock'
  | 'complete';

/**
 * Pitches are from a pentatonic scale on C, so any two sounds that overlap
 * still sound consonant. With a per-question clock ticking under a correct
 * chime, that is not a hypothetical.
 */
const SFX: Record<SfxName, Voice> = {
  // C5 -> G5. Rising = yes.
  correct: { notes: [523.25, 783.99], dur: 0.09, type: 'sine', gain: 0.14 },
  // Low, soft, single. Falling but gentle.
  wrong: { notes: [220, 174.61], dur: 0.13, type: 'sine', gain: 0.1, glide: true },
  // C5 E5 G5 C6 - an actual arpeggio, because levelling up is the payoff.
  levelUp: { notes: [523.25, 659.25, 783.99, 1046.5], dur: 0.08, type: 'triangle', gain: 0.13 },
  cardFlip: { notes: [1200, 700], dur: 0.035, type: 'triangle', gain: 0.07, glide: true },
  reveal: { notes: [659.25, 987.77], dur: 0.11, type: 'sine', gain: 0.1 },
  select: { notes: [880], dur: 0.03, type: 'sine', gain: 0.06 },
  page: { notes: [420, 300], dur: 0.05, type: 'triangle', gain: 0.06, glide: true },
  // Climbs with the streak; see playStreak.
  streak: { notes: [1046.5], dur: 0.07, type: 'sine', gain: 0.11 },
  tick: { notes: [1600], dur: 0.015, type: 'square', gain: 0.03 },
  unlock: { notes: [392, 523.25, 659.25], dur: 0.1, type: 'triangle', gain: 0.12 },
  complete: { notes: [523.25, 659.25, 783.99, 1046.5, 1318.5], dur: 0.1, type: 'triangle', gain: 0.12 },
};

const STORAGE_KEY = 'hq_sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let loaded = false;

function readPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    // Private browsing, blocked storage: default to on rather than silent.
    return true;
  }
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!loaded) {
    enabled = readPreference();
    loaded = true;
  }
  if (!enabled) return null;

  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  // Browsers suspend the context until a user gesture. Every call tries to
  // resume, so the first tap unlocks audio without any explicit "enable sound"
  // step - which nobody ever taps.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Play one named sound. Never throws, never blocks, never awaits. */
export function sfx(name: SfxName, opts: { detune?: number; volume?: number } = {}) {
  const audio = ensureContext();
  if (!audio || !master) return;

  const voice = SFX[name];
  if (!voice) return;

  const step = voice.step ?? voice.dur;
  const now = audio.currentTime;
  const semitone = Math.pow(2, (opts.detune ?? 0) / 12);
  const volume = (opts.volume ?? 1) * voice.gain;

  try {
    if (voice.glide && voice.notes.length > 1) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = voice.type;
      osc.frequency.setValueAtTime(voice.notes[0] * semitone, now);
      osc.frequency.exponentialRampToValueAtTime(
        voice.notes[voice.notes.length - 1] * semitone,
        now + voice.dur * voice.notes.length,
      );
      shape(gain, now, voice.dur * voice.notes.length, volume);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + voice.dur * voice.notes.length + 0.05);
      return;
    }

    voice.notes.forEach((freq, i) => {
      const at = now + i * step;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = voice.type;
      osc.frequency.setValueAtTime(freq * semitone, at);
      shape(gain, at, voice.dur, volume);
      osc.connect(gain).connect(master!);
      osc.start(at);
      osc.stop(at + voice.dur + 0.05);
    });
  } catch {
    // An audio failure must never break a lesson.
  }
}

/**
 * Short attack, exponential release.
 *
 * A hard gain step produces an audible click on every note; ramping the
 * envelope is the difference between "sound design" and "a computer beeping".
 */
function shape(gain: GainNode, at: number, dur: number, peak: number) {
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
}

/** Streak pings climb, so a run of correct answers audibly builds. */
export function playStreak(streak: number) {
  // Cap the climb at an octave so it never becomes shrill.
  sfx('streak', { detune: Math.min(12, Math.max(0, streak - 1) * 2) });
}

export function isSoundOn(): boolean {
  if (!loaded) {
    enabled = readPreference();
    loaded = true;
  }
  return enabled;
}

export function setSoundOn(on: boolean) {
  enabled = on;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Preference is lost on reload; the sound still works this session.
  }
  if (on) {
    ensureContext();
    sfx('select');
  }
}

export function toggleSound(): boolean {
  const next = !isSoundOn();
  setSoundOn(next);
  return next;
}
