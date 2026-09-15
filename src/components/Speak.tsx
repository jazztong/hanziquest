'use client';

import { useCallback, useRef, useState } from 'react';
import { pickVoice, setAudioBlocked, voicesReady } from '@/lib/voices';
import { voiceProfile } from '@/lib/voice-profiles';

/**
 * Speak a line of Chinese.
 *
 * Nothing is awaited between the tap and the speaking, and that is the whole
 * design. This used to ask /api/tts for a plan first, then wait for the voice
 * list, and only then speak. Three problems, one cause:
 *
 *  - iOS Safari only allows speech that starts synchronously inside a user
 *    gesture. Any await forfeits it, so on a phone the utterance never
 *    happened at all.
 *  - The round trip cost ~291ms warm and 7.2s against a cold Worker, before
 *    any sound. A learner waiting on a listening question reads that as broken.
 *  - If the request failed, the error body had no `clip`, so reading
 *    `plan.clip.cached` threw inside an async callback - silence, no fallback,
 *    and the broken plan cached so that line stayed mute for the session.
 *
 * It bought nothing in return: there are no pre-rendered clips on Cloudflare
 * (no filesystem) and no Azure key means no better voice, so the response was a
 * constant pitch and rate that now live in voice-profiles.ts.
 *
 * `onBoundary` fires per spoken character where the platform supports it, which
 * is what drives the karaoke highlight.
 */
export interface SpeakHandle {
  speak: () => void;
  stop: () => void;
}

interface Props {
  text: string;
  speaker?: string;
  className?: string;
  label?: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

export function useSpeak() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (
      text: string,
      speaker = 'narrator',
      cb?: { onEnd?: () => void; onBoundary?: (i: number) => void },
    ) => {
      if (!text.trim()) return;
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        cb?.onEnd?.();
        return;
      }

      stop();
      setSpeaking(true);

      const profile = voiceProfile(speaker);
      const done = () => setSpeaking(false);

      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.pitch = profile.pitch;
      u.rate = profile.rate;

      // Read synchronously. getVoices() is empty until the list loads, and
      // waiting for it would cost the gesture - so an unvoiced first utterance
      // is spoken with lang alone, which the browser honours, and the list is
      // warmed for every utterance after it.
      const zh = pickVoice(window.speechSynthesis.getVoices());
      if (zh) u.voice = zh;
      else void voicesReady();

      u.onboundary = (e) => cb?.onBoundary?.(e.charIndex);
      u.onstart = () => setAudioBlocked(false);
      u.onend = () => {
        done();
        cb?.onEnd?.();
      };
      u.onerror = (e) => {
        // Chrome refuses until the page has had a real interaction. Recorded
        // rather than swallowed, so the UI can offer to turn sound on instead
        // of just appearing mute.
        if (e.error === 'not-allowed') setAudioBlocked(true);
        done();
        cb?.onEnd?.();
      };

      window.speechSynthesis.speak(u);
    },
    [stop],
  );

  return { speak, stop, speaking };
}

export default function Speak({
  text,
  speaker = 'narrator',
  className = '',
  label,
  onStart,
  onEnd,
  onBoundary,
}: Props) {
  const { speak, speaking } = useSpeak();
  return (
    <button
      type="button"
      aria-label={label ?? `Play: ${text}`}
      className={`btn btn-ghost px-3 py-1.5 text-sm ${className}`}
      onClick={() => {
        onStart?.();
        speak(text, speaker, { onEnd, onBoundary });
      }}
    >
      <span aria-hidden>{speaking ? '◼' : '▶'}</span>
      {label && <span>{label}</span>}
    </button>
  );
}
