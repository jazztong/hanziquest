'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Speak from './Speak';
import HanziPad from './HanziPad';

/**
 * The pre-chapter gear-up.
 *
 * This screen exists because the coverage gate refuses to serve a chapter the
 * player cannot read - and the right response to that is to teach the missing
 * characters, not to hide the chapter. Framed as equipment, not as remediation:
 * the player is picking up what they need before going in.
 */
export default function PreTeach({
  chars,
  chapterTitle,
  onDone,
}: {
  chars: { c: string; count: number; band: number; gloss: string }[];
  chapterTitle: string;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [wrote, setWrote] = useState(false);
  const current = chars[i];

  if (!current) {
    onDone();
    return null;
  }

  const last = i === chars.length - 1;

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto">
      <p className="pill">Gear up · {i + 1} of {chars.length}</p>
      <h1 className="text-xl font-bold mt-3">Before “{chapterTitle}”</h1>
      <p className="text-sm text-[var(--color-slate-soft)] mt-1.5 leading-relaxed">
        These turn up {chars.reduce((a, c) => a + c.count, 0)} times in the next chapter. Learn them
        now and the chapter reads straight through.
      </p>

      <motion.div
        key={current.c}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface p-6 mt-6 text-center"
      >
        <div className="zh-display text-8xl leading-none">{current.c}</div>
        <div className="mt-4">
          <Speak text={current.c} speaker="system" label="Hear it" />
        </div>
        <p className="text-sm text-[var(--color-paper-dim)] mt-4">{current.gloss || '—'}</p>
        <p className="text-[11px] text-[var(--color-slate)] mt-1">
          HSK band {current.band} · appears {current.count}× in this chapter
        </p>

        <div className="mt-6 pt-6 border-t border-[#2a3648]">
          <HanziPad char={current.c} size={200} onDone={() => setWrote(true)} />
        </div>
      </motion.div>

      <button
        className="btn btn-primary w-full mt-5"
        onClick={() => {
          setWrote(false);
          if (last) onDone();
          else setI((n) => n + 1);
        }}
      >
        {last ? 'Into the chapter' : wrote ? 'Next' : 'Skip writing, next'}
      </button>
    </main>
  );
}
