'use client';

import { useState } from 'react';
import { useSpeak } from './Speak';

export interface Gloss {
  found: boolean;
  value: string;
  reading: string;
  ambiguous: boolean;
  allReadings: string[];
  gloss: string;
  band: number | null;
  radical: string;
  rarity: string | null;
}

/**
 * Chinese text where every character is tappable.
 *
 * `targets` are the chapter's teaching words - they get a visible underline so
 * the player knows which ones are the point. `support` controls how much English
 * shows without tapping, and is computed per chapter from coverage rather than
 * being a user setting, so the scaffolding withdraws on its own.
 */
export default function HanziText({
  text,
  targets = [],
  support = 'full',
  className = '',
  activeIndex = -1,
}: {
  text: string;
  targets?: string[];
  support?: 'full' | 'pinyin' | 'none';
  className?: string;
  /** Character index currently being spoken, for karaoke highlighting. */
  activeIndex?: number;
}) {
  const [open, setOpen] = useState<{ index: number; data: Gloss } | null>(null);
  const [loading, setLoading] = useState(-1);
  const { speak } = useSpeak();

  const targetChars = new Set(targets.flatMap((t) => [...t]));

  async function tap(ch: string, index: number) {
    if (!/[一-鿿]/u.test(ch)) return;
    setLoading(index);
    const res = await fetch(
      `/api/lexicon?q=${encodeURIComponent(ch)}&context=${encodeURIComponent(text)}&index=${index}`,
    );
    const data = (await res.json()) as Gloss;
    setLoading(-1);
    setOpen({ index, data });
    void speak(ch, 'narrator');
  }

  return (
    <span className={`zh ${className}`}>
      {[...text].map((ch, i) => {
        const hanzi = /[一-鿿]/u.test(ch);
        const isTarget = targetChars.has(ch);
        return (
          <span key={i} className="relative">
            <span
              role={hanzi ? 'button' : undefined}
              tabIndex={hanzi ? 0 : undefined}
              onClick={() => tap(ch, i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void tap(ch, i);
                }
              }}
              className={[
                hanzi ? 'tappable' : '',
                isTarget ? 'tappable-target' : '',
                activeIndex === i ? 'syl-on' : '',
                loading === i ? 'opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {ch}
            </span>
            {open?.index === i && (
              <GlossCard data={open.data} support={support} onClose={() => setOpen(null)} />
            )}
          </span>
        );
      })}
    </span>
  );
}

function GlossCard({
  data,
  support,
  onClose,
}: {
  data: Gloss;
  support: 'full' | 'pinyin' | 'none';
  onClose: () => void;
}) {
  return (
    <span
      className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-56 surface-paper p-3 text-left block"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <span className="flex items-baseline gap-2">
        <span className="zh text-2xl leading-none">{data.value}</span>
        <span className="text-sm font-semibold text-[var(--color-jade)]">{data.reading}</span>
        {data.band && (
          <span className="ml-auto text-[10px] uppercase tracking-wide text-[var(--color-slate)]">
            HSK {data.band}
          </span>
        )}
      </span>
      {support !== 'none' && data.gloss && (
        <span className="block mt-1.5 text-sm text-[var(--color-ink-soft)] leading-snug">
          {data.gloss}
        </span>
      )}
      {data.ambiguous && (
        <span className="block mt-2 text-[11px] leading-snug text-[var(--color-cinnabar)]">
          多音字 — also read {data.allReadings.filter((r) => r !== data.reading).join(', ')}. Here it
          is <b>{data.reading}</b> because of the words around it.
        </span>
      )}
      {data.radical && (
        <span className="block mt-1.5 text-[11px] text-[var(--color-slate)]">
          radical 部首 <span className="zh">{data.radical}</span>
        </span>
      )}
    </span>
  );
}
