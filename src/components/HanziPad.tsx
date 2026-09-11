'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Write-to-check, on Hanzi Writer's quiz mode.
 *
 * Score is strokes-right-first-time over total strokes, not "did you finish".
 * Hanzi Writer will happily accept a stroke after three wrong attempts and a
 * hint, and counting that as success would let the player finish every card
 * without learning the order - which is the only thing stroke practice is for.
 */
export default function HanziPad({
  char,
  size = 260,
  onDone,
  showOutline = true,
}: {
  char: string;
  size?: number;
  onDone: (score: number, detail: { mistakes: number; strokes: number }) => void;
  showOutline?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'writing' | 'done'>('idle');
  const [mistakes, setMistakes] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('idle');
    setMistakes(0);
    setReady(false);

    (async () => {
      const mod = await import('hanzi-writer');
      if (cancelled || !hostRef.current) return;
      // replaceChildren, not innerHTML: nothing is being injected, only cleared.
      hostRef.current.replaceChildren();
      const HanziWriter = mod.default;
      const writer = HanziWriter.create(hostRef.current, char, {
        width: size,
        height: size,
        padding: 12,
        showCharacter: false,
        showOutline,
        strokeColor: '#1F8A80',
        outlineColor: '#3a4a5f',
        drawingColor: '#E0A33E',
        highlightColor: '#C8442F',
        strokeAnimationSpeed: 1.1,
        delayBetweenStrokes: 120,
      });
      writerRef.current = writer;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      writerRef.current = null;
    };
  }, [char, size, showOutline]);

  function start() {
    const writer = writerRef.current;
    if (!writer) return;
    setMistakes(0);
    setStatus('writing');
    writer.quiz({
      onMistake: () => setMistakes((m) => m + 1),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onComplete: (summary: any) => {
        const total = writer._character?.strokes?.length ?? 1;
        const miss = summary?.totalMistakes ?? 0;
        // Each mistake costs one stroke's worth of credit, floored at zero.
        const score = Math.max(0, (total - miss) / total);
        setStatus('done');
        onDone(Math.round(score * 100) / 100, { mistakes: miss, strokes: total });
      },
    });
  }

  function demo() {
    writerRef.current?.animateCharacter();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="surface-paper grid place-items-center"
        style={{ width: size + 16, height: size + 16 }}
      >
        <div ref={hostRef} />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-ghost" onClick={demo} disabled={!ready}>
          👁 Watch once
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={start}
          disabled={!ready || status === 'writing'}
        >
          {status === 'done' ? 'Write again' : 'Write it'}
        </button>
      </div>
      {status === 'writing' && (
        <p className="text-xs text-[var(--color-slate-soft)]">
          Draw stroke by stroke. {mistakes > 0 && `${mistakes} out of order so far.`}
        </p>
      )}
    </div>
  );
}
