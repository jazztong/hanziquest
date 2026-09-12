'use client';

import { isSoundOn } from './sfx';

/**
 * Spoken feedback the instant an answer is chosen.
 *
 * A tone tells you that something happened. A voice tells you what. And since
 * this is a Chinese app, the affirmation is spoken in Chinese rather than
 * English: he gets the reinforcement and a second of listening practice from
 * the same moment, and it keeps the zh-CN voice consistent - an English "yes"
 * in a Mandarin voice sounds wrong.
 *
 * Correct → an affirmation, then the word itself.
 * Wrong   → "try again", then the word, so he still hears the right answer.
 *
 * Hearing the target after a mistake matters more than hearing it after a
 * success: the wrong answer is the one he needs overwritten.
 */

export interface Affirmation {
  zh: string;
  pinyin: string;
  en: string;
}

/**
 * Rotated rather than fixed.
 *
 * The same two syllables on every correct answer stops registering after about
 * twenty questions, and the prologue alone is fifty-one. These are all things a
 * teacher actually says, and they are short enough not to slow the pace.
 */
export const CORRECT: Affirmation[] = [
  { zh: '对了', pinyin: 'duì le', en: 'that’s right' },
  { zh: '很好', pinyin: 'hěn hǎo', en: 'very good' },
  { zh: '没错', pinyin: 'méi cuò', en: 'correct' },
  { zh: '真棒', pinyin: 'zhēn bàng', en: 'excellent' },
  { zh: '答对了', pinyin: 'dá duì le', en: 'you got it' },
];

/**
 * Deliberately gentle and deliberately not "wrong".
 *
 * Nothing else in this app punishes a mistake, and the voice should not be the
 * exception. 再试一次 is an invitation; 错了 is a verdict.
 */
export const INCORRECT: Affirmation[] = [
  { zh: '再试一次', pinyin: 'zài shì yí cì', en: 'try again' },
  { zh: '再想一想', pinyin: 'zài xiǎng yi xiǎng', en: 'have another think' },
  { zh: '差一点', pinyin: 'chà yì diǎn', en: 'not quite' },
];

let lastCorrect = -1;
let lastIncorrect = -1;

/** Pick the next affirmation, never repeating the previous one. */
export function pickAffirmation(correct: boolean): Affirmation {
  const pool = correct ? CORRECT : INCORRECT;
  const last = correct ? lastCorrect : lastIncorrect;
  let i = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && i === last) i = (i + 1) % pool.length;
  if (correct) lastCorrect = i;
  else lastIncorrect = i;
  return pool[i];
}

export type SpeakFn = (
  text: string,
  speaker?: string,
  cb?: { onEnd?: () => void; onBoundary?: (i: number) => void },
) => void | Promise<void>;

export interface VoiceFeedbackOptions {
  correct: boolean;
  /** The Chinese to say after the affirmation. Omit to say only the affirmation. */
  target?: string;
  speak: SpeakFn;
  /** Called once the whole sequence has finished. */
  onEnd?: () => void;
}

/**
 * Speak the affirmation, then the target.
 *
 * Sequenced on `onEnd` rather than fired together: two utterances started at
 * once either overlap or get dropped, depending on the platform's speech queue.
 *
 * Returns the affirmation so the caller can show the same words on screen -
 * seeing 对了 while hearing it is how the phrase itself gets learned.
 */
export function speakFeedback({
  correct,
  target,
  speak,
  onEnd,
}: VoiceFeedbackOptions): Affirmation {
  const affirmation = pickAffirmation(correct);

  // Voice feedback is interface chrome, so it follows the sound toggle. Chapter
  // narration is content and stays independent of it.
  if (!isSoundOn()) {
    onEnd?.();
    return affirmation;
  }

  const sayTarget = () => {
    if (!target?.trim()) {
      onEnd?.();
      return;
    }
    void speak(target, 'system', { onEnd: () => onEnd?.() });
  };

  void speak(affirmation.zh, 'system', { onEnd: sayTarget });
  return affirmation;
}
