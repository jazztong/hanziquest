'use client';

import { useEffect } from 'react';
import { primeSpeech } from '@/lib/voices';

/**
 * Spends the player's first tap unlocking the speech engine.
 *
 * Mounted once in the root layout so it covers every screen, including the ones
 * that speak without being asked - a listening question that plays on arrival,
 * a chapter that reads itself. Those are not gestures, and iOS refuses speech
 * that did not begin inside one, so they were silent on a phone no matter how
 * the utterance was built.
 *
 * Renders nothing.
 */
export default function AudioPrimer() {
  useEffect(() => primeSpeech(), []);
  return null;
}
