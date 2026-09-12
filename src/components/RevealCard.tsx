'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSpeak } from './Speak';

export interface Reveal {
  zh: string;
  pinyin: string;
  gloss: string;
  parts: { char: string; pinyin: string; gloss: string }[];
  polyphonic?: { readings: string[]; note: string };
  tones: number[];
  speak: string;
  band: number | null;
  radical: string;
}

/**
 * Shown the instant an answer is committed: the character, its reading, and
 * what it means.
 *
 * The pinyin is the headline, not a footnote. This learner's recognition runs
 * ahead of his pronunciation, so the reading is the thing he is least likely to
 * have supplied for himself while answering — and this is the one moment he is
 * certain to be looking.
 *
 * It speaks on appearance. Hearing it at the same instant as seeing it is the
 * whole point; making him press a button to find out how it sounds means he
 * usually will not.
 */
export default function RevealCard({
  reveal,
  correct,
  autoSpeak = true,
}: {
  reveal: Reveal;
  correct: boolean | null;
  autoSpeak?: boolean;
}) {
  const { speak } = useSpeak();
  const spoken = useRef('');

  useEffect(() => {
    if (!autoSpeak) return;
    // Guard against React re-running the effect for the same reveal.
    if (spoken.current === reveal.speak) return;
    spoken.current = reveal.speak;
    const t = setTimeout(() => void speak(reveal.speak, 'system'), 180);
    return () => clearTimeout(t);
  }, [reveal.speak, autoSpeak, speak]);

  const accent =
    correct === false ? 'var(--color-cinnabar)' : 'var(--color-jade-bright)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="surface-paper p-4 mt-4"
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => void speak(reveal.speak, 'system')}
          aria-label={`Hear ${reveal.zh}`}
          className="shrink-0 text-left"
        >
          <div className="zh-display text-5xl leading-none text-[var(--color-ink)]">
            {reveal.zh}
          </div>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold" style={{ color: accent }}>
              {reveal.pinyin}
            </span>
            <ToneBar tones={reveal.tones} />
            <button
              type="button"
              onClick={() => void speak(reveal.speak, 'system')}
              className="text-xs text-[var(--color-slate)] underline underline-offset-4"
            >
              hear it
            </button>
          </div>

          {reveal.gloss && (
            <p className="text-sm text-[var(--color-ink-soft)] mt-1 leading-snug">{reveal.gloss}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--color-slate)]">
            {reveal.band !== null && <span>HSK {reveal.band}</span>}
            {reveal.radical && (
              <span>
                部首 <span className="zh">{reveal.radical}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Per-character breakdown for words. A two-character word is two
          readings, and seeing them separately is how they become reusable. */}
      {reveal.parts.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--color-paper-dim)]">
          {reveal.parts.map((p, i) => (
            <button
              key={`${p.char}-${i}`}
              type="button"
              onClick={() => void speak(p.char, 'system')}
              className="text-center px-2 py-1 rounded bg-[var(--color-paper-dim)]"
            >
              <div className="zh text-xl leading-none text-[var(--color-ink)]">{p.char}</div>
              <div className="text-[11px] font-semibold text-[var(--color-jade)] mt-0.5">
                {p.pinyin}
              </div>
              {p.gloss && (
                <div className="text-[10px] text-[var(--color-slate)] max-w-[7rem] truncate">
                  {p.gloss.split(';')[0]}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {reveal.polyphonic && (
        <p className="text-[11px] leading-snug text-[var(--color-cinnabar)] mt-3">
          {reveal.polyphonic.note}
        </p>
      )}
    </motion.div>
  );
}

/**
 * The tone contour, drawn rather than written.
 *
 * A number tells you which tone; a shape tells you what to do with your voice.
 * For a learner whose tones are the weak point, the shape is the useful half.
 */
function ToneBar({ tones }: { tones: number[] }) {
  if (!tones.length) return null;
  const shape: Record<number, string> = {
    1: 'M1,4 L15,4', // high level
    2: 'M1,11 L15,3', // rising
    3: 'M1,5 L6,12 L15,3', // dipping
    4: 'M1,3 L15,12', // falling
    5: 'M6,7 L10,7', // neutral
  };
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {tones.map((t, i) => (
        <svg key={i} width="16" height="15" viewBox="0 0 16 15">
          <path
            d={shape[t] ?? shape[5]}
            fill="none"
            stroke="var(--color-slate)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}
