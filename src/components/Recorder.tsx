'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Read-aloud capture.
 *
 * Uses the browser's SpeechRecognition for the transcript (free, on-device on
 * some platforms) and MediaRecorder in parallel for the audio itself, because
 * the parent dashboard has to be able to play back what the child actually
 * said. A transcript alone would let the app claim a score with no evidence.
 *
 * If SpeechRecognition is missing (Firefox, some mobile browsers) the recorder
 * still captures audio and the attempt is stored unscored rather than failing -
 * the parent can listen and judge it themselves.
 */
type Rec = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): Rec | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function Recorder({
  targetText,
  onResult,
  disabled,
}: {
  targetText: string;
  /** transcript may be '' when recognition is unavailable. */
  onResult: (transcript: string, audio: Blob | null) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [supported, setSupported] = useState(true);
  const [heard, setHeard] = useState('');
  const recRef = useRef<Rec | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => {
      recRef.current?.abort();
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setHeard('');
    setState('listening');
    chunksRef.current = [];

    let audioBlob: Blob | null = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start();
    } catch {
      // No mic permission: carry on with recognition only, if available.
    }

    const rec = getRecognition();
    if (!rec) {
      // No recogniser. Give the player 6 seconds of recording, then hand back
      // an empty transcript so the attempt is stored but not scored.
      setTimeout(() => void finish(''), 6000);
      return;
    }

    recRef.current = rec;
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      const text = Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>)
        .map((r) => r[0].transcript)
        .join('');
      setHeard(text);
    };
    rec.onerror = () => void finish(heard);
    rec.onend = () => void finish(heard);
    rec.start();

    void audioBlob;
  }

  async function finish(transcript: string) {
    setState('processing');
    recRef.current?.abort();
    recRef.current = null;

    let blob: Blob | null = null;
    const mr = mediaRef.current;
    if (mr && mr.state !== 'inactive') {
      blob = await new Promise<Blob | null>((resolve) => {
        mr.onstop = () => resolve(new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' }));
        mr.stop();
      });
      mr.stream.getTracks().forEach((t) => t.stop());
    }
    mediaRef.current = null;
    setState('idle');
    onResult(transcript.trim(), blob);
  }

  function stopNow() {
    if (recRef.current) recRef.current.stop();
    else void finish('');
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={disabled || state === 'processing'}
        onClick={state === 'listening' ? stopNow : start}
        className={`btn ${state === 'listening' ? 'btn-ghost' : 'btn-primary'} px-6 py-3`}
      >
        {state === 'listening' ? '◼ Stop' : state === 'processing' ? 'Checking…' : '🎙 Read it aloud'}
      </button>

      {state === 'listening' && (
        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-[var(--color-jade)]"
              style={{
                height: 10 + ((i * 7) % 16),
                animation: `pulse 700ms ${i * 90}ms ease-in-out infinite alternate`,
              }}
            />
          ))}
          <style>{`@keyframes pulse { to { transform: scaleY(1.9); } }`}</style>
        </div>
      )}

      {heard && (
        <p className="zh text-sm text-[var(--color-slate-soft)]">
          heard: <span className="text-[var(--color-paper)]">{heard}</span>
        </p>
      )}

      {!supported && state === 'idle' && (
        <p className="text-[11px] text-[var(--color-slate)] max-w-xs text-center leading-snug">
          This browser cannot transcribe speech, so the recording is saved for your parent to hear
          but not scored. Chrome or Edge will score it.
        </p>
      )}
      <p className="sr-only">Target: {targetText}</p>
    </div>
  );
}
