'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import HanziPad from '@/components/HanziPad';
import Speak from '@/components/Speak';

interface Card {
  id: string;
  kind: 'char' | 'word';
  value: string;
  readings: string[];
  polyphonic: boolean;
  gloss: string;
  radical: string;
  band: number | null;
  rarity: string;
  cardLevel: number;
  state: number;
  canWrite: boolean;
  reps: number;
}

type Mode = 'recognise' | 'write';

export default function Deck() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [dueTotal, setDueTotal] = useState(0);
  const [deferred, setDeferred] = useState(0);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [mode, setMode] = useState<Mode>('recognise');
  const [result, setResult] = useState<{ cardLevel: number; levelledUp: boolean; dueInDays: number } | null>(null);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    fetch('/api/cards/queue?limit=30')
      .then((r) => r.json())
      .then((b) => {
        setQueue(b.cards ?? []);
        setDueTotal(b.dueTotal ?? 0);
        setDeferred(b.deferred ?? 0);
        if (!b.cards?.length) setDone(true);
      });
  }, []);

  const card = queue[i];

  // Alternate recognise / write. A card only gets a writing turn once it can
  // already be read - writing a character you cannot recognise is copying, not
  // recall, and FSRS would be scheduling the wrong memory.
  useEffect(() => {
    if (!card) return;
    setRevealed(false);
    setUsedHint(false);
    setResult(null);
    startedAt.current = Date.now();
    const canWriteTurn = card.kind === 'char' && card.state >= 2 && card.reps >= 2;
    setMode(canWriteTurn && card.reps % 3 === 0 ? 'write' : 'recognise');
  }, [card]);

  const grade = useCallback(
    async (correct: boolean, quality?: number) => {
      if (!card) return;
      const res = await fetch('/api/cards/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          mode,
          correct,
          quality,
          usedHint,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const b = await res.json();
      setResult(b);
      setTimeout(() => {
        if (i + 1 >= queue.length) setDone(true);
        else setI((n) => n + 1);
      }, b.levelledUp ? 1400 : 750);
    },
    [card, mode, usedHint, i, queue.length],
  );

  if (done) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div className="max-w-sm">
          <div className="text-5xl mb-4" aria-hidden>🎴</div>
          <h1 className="text-2xl font-bold">
            {dueTotal === 0 ? 'Nothing due right now.' : 'Session done.'}
          </h1>
          <p className="text-sm text-[var(--color-slate-soft)] mt-2 leading-relaxed">
            {deferred > 0
              ? `${deferred} more cards are due but held back for tomorrow — a wall of cards is how people stop opening the app.`
              : 'The deck is clear. New cards arrive from the next chapter.'}
          </p>
          <div className="flex gap-2 mt-7">
            <Link href="/play" className="btn btn-ghost flex-1">
              Map
            </Link>
            <Link href="/play/chapter" className="btn btn-primary flex-1">
              Next chapter
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <p className="text-[var(--color-slate-soft)]">Shuffling…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-5 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <Link href="/play" className="btn btn-ghost px-2.5 py-1 text-xs">←</Link>
        <div className="flex-1 progress">
          <i style={{ width: `${((i + 1) / queue.length) * 100}%` }} />
        </div>
        <span className="text-xs text-[var(--color-slate-soft)]">
          {i + 1}/{queue.length}
        </span>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id + mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`card-face r-${card.rarity} rounded-2xl p-6`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
            <span style={{ color: 'var(--rarity)' }}>{card.rarity}</span>
            <span className="text-[var(--color-slate)]">
              Lv {card.cardLevel} {card.band ? `· HSK ${card.band}` : ''}
            </span>
          </div>

          {mode === 'recognise' ? (
            <>
              <div className="text-center py-8">
                <div className="zh-display text-[5.5rem] leading-none">{card.value}</div>
              </div>

              {!revealed ? (
                <div className="space-y-3">
                  <button className="btn btn-primary w-full" onClick={() => setRevealed(true)}>
                    Show me
                  </button>
                  <button
                    className="block mx-auto text-xs text-[var(--color-slate-soft)] underline underline-offset-4"
                    onClick={() => {
                      setUsedHint(true);
                      setRevealed(true);
                    }}
                  >
                    I don’t know it
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-jade-bright)]">
                      {card.readings[0] ?? ''}
                    </div>
                    {card.polyphonic && (
                      <p className="text-[11px] text-[var(--color-cinnabar)] mt-1">
                        多音字 — also {card.readings.slice(1).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-[var(--color-paper-dim)] mt-2">{card.gloss}</p>
                    {card.radical && (
                      <p className="text-[11px] text-[var(--color-slate)] mt-1">
                        radical <span className="zh">{card.radical}</span>
                      </p>
                    )}
                    <div className="mt-3">
                      <Speak text={card.value} speaker="system" label="Hear it" />
                    </div>
                  </div>

                  {result ? (
                    <p className="text-center text-sm mt-6 text-[var(--color-jade-bright)]">
                      {result.levelledUp ? `Card levelled up to ${result.cardLevel}!` : 'Saved.'}
                      <span className="block text-[11px] text-[var(--color-slate)] mt-1">
                        back in {result.dueInDays} day{result.dueInDays === 1 ? '' : 's'}
                      </span>
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button className="btn btn-ghost" onClick={() => grade(false)}>
                        Missed it
                      </button>
                      <button className="btn btn-primary" onClick={() => grade(true)}>
                        Knew it
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            <div className="py-4">
              <p className="text-center text-sm text-[var(--color-slate-soft)] mb-1">
                Write it from memory
              </p>
              <p className="text-center text-lg text-[var(--color-paper-dim)] mb-4">
                {card.readings[0]} — {card.gloss}
              </p>
              {result ? (
                <p className="text-center text-sm text-[var(--color-jade-bright)]">
                  {result.levelledUp ? `Levelled up to ${result.cardLevel}!` : 'Saved.'}
                </p>
              ) : (
                <HanziPad
                  char={card.value}
                  size={230}
                  showOutline={false}
                  onDone={(score) => grade(score >= 0.6, score)}
                />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
