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
  size,
  maxSize = 260,
  onDone,
  showOutline = true,
}: {
  char: string;
  /** Fixed size in px. Omit to fill the available width, which is the default. */
  size?: number;
  /** Ceiling when measuring. Bigger than this just wastes vertical space. */
  maxSize?: number;
  onDone: (score: number, detail: { mistakes: number; strokes: number }) => void;
  showOutline?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  /**
   * Measured rather than fixed.
   *
   * It was hard-coded to 260px, which is 276px with its frame. A 320px phone
   * leaves about 256px inside a card once the page gutter and card padding are
   * taken out, so the writing box pushed the whole page sideways - on the one
   * screen where the child is supposed to be drawing with a finger.
   */
  const [measured, setMeasured] = useState<number | null>(size ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'writing' | 'done'>('idle');
  const [mistakes, setMistakes] = useState(0);
  const [ready, setReady] = useState(false);

  // Track the available width. ResizeObserver rather than a one-off read so
  // rotating the phone re-fits instead of clipping.
  useEffect(() => {
    if (size) return;
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const avail = box.getBoundingClientRect().width;
      if (avail > 0) setMeasured(Math.max(160, Math.min(maxSize, Math.floor(avail) - 16)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [size, maxSize]);

  useEffect(() => {
    let cancelled = false;
    setStatus('idle');
    setMistakes(0);
    setReady(false);

    if (!measured) return;

    (async () => {
      const mod = await import('hanzi-writer');
      if (cancelled || !hostRef.current) return;
      // replaceChildren, not innerHTML: nothing is being injected, only cleared.
      hostRef.current.replaceChildren();
      const HanziWriter = mod.default;
      const writer = HanziWriter.create(hostRef.current, char, {
        width: measured,
        height: measured,
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
  }, [char, measured, showOutline]);

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
    <div ref={boxRef} className="flex flex-col items-center gap-3 w-full">
      <div
        className="surface-paper grid place-items-center max-w-full"
        style={
          measured
            ? { width: measured + 16, height: measured + 16 }
            : { width: '100%', aspectRatio: '1 / 1' }
        }
      >
        <div ref={hostRef} />
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={demo}
          disabled={!ready}
          style={{ minHeight: 44 }}
        >
          👁 Watch once
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={start}
          disabled={!ready || status === 'writing'}
          style={{ minHeight: 44 }}
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
