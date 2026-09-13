'use client';

import { useCallback, useRef, useState } from 'react';
import { pickVoice, setAudioBlocked, voicesReady } from '@/lib/voices';

/**
 * Speak a line of Chinese.
 *
 * Asks the server for a plan. If Azure rendered an mp3, play that - it is a
 * better voice, it is cached, and it works offline. Otherwise fall back to the
 * browser's own zh-CN synthesis with the pitch/rate hints for this speaker, so
 * characters still sound different from one another without any key.
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

type Plan = {
  clip: { url: string; cached: boolean; web: { pitch: number; rate: number } };
  azure: boolean;
};

const planCache = new Map<string, Plan>();

export function useSpeak() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (
      text: string,
      speaker = 'narrator',
      cb?: { onEnd?: () => void; onBoundary?: (i: number) => void },
    ) => {
      if (!text.trim()) return;
      stop();
      setSpeaking(true);

      const key = `${speaker}::${text}`;
      let plan = planCache.get(key);
      if (!plan) {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text, speaker }),
          });
          plan = (await res.json()) as Plan;
          planCache.set(key, plan);
        } catch {
          plan = undefined;
        }
      }

      if (plan?.clip.cached) {
        const audio = new Audio(plan.clip.url);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          cb?.onEnd?.();
        };
        audio.onerror = () => {
          // A missing file should fall through to Web Speech rather than
          // silently doing nothing - a chapter with no voice is broken.
          void webSpeak(text, plan!.clip.web, cb, () => setSpeaking(false));
        };
        void audio.play().catch(() => void webSpeak(text, plan!.clip.web, cb, () => setSpeaking(false)));
        return;
      }

      void webSpeak(text, plan?.clip.web ?? { pitch: 1, rate: 0.85 }, cb, () => setSpeaking(false));
    },
    [stop],
  );

  return { speak, stop, speaking };
}

async function webSpeak(
  text: string,
  voice: { pitch: number; rate: number },
  cb: { onEnd?: () => void; onBoundary?: (i: number) => void } | undefined,
  done: () => void,
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    done();
    cb?.onEnd?.();
    return;
  }

  // Wait for the voice list before choosing. getVoices() is empty on the first
  // call - the list arrives asynchronously - so selecting synchronously meant
  // the first line spoken in a session never got a Chinese voice.
  const zh = pickVoice(await voicesReady());

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.pitch = voice.pitch;
  u.rate = voice.rate;
  if (zh) u.voice = zh;
  u.onboundary = (e) => cb?.onBoundary?.(e.charIndex);
  u.onstart = () => setAudioBlocked(false);
  u.onend = () => {
    done();
    cb?.onEnd?.();
  };
  u.onerror = (e) => {
    // Chrome refuses to speak until the page has had a real interaction. That
    // is not a failure worth hiding: the UI can offer to turn sound on rather
    // than just appearing mute.
    if (e.error === 'not-allowed') setAudioBlocked(true);
    done();
    cb?.onEnd?.();
  };
  window.speechSynthesis.speak(u);
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
        void speak(text, speaker, { onEnd, onBoundary });
      }}
    >
      <span aria-hidden>{speaking ? '◼' : '▶'}</span>
      {label && <span>{label}</span>}
    </button>
  );
}
