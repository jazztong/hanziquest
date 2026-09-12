'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ArtImage from '@/components/ArtImage';
import Recorder from '@/components/Recorder';
import Speak, { useSpeak } from '@/components/Speak';
import { sfx } from '@/lib/sfx';

interface Relic {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  dynasty: string;
  book: string;
  lesson: string;
  year: number;
  form: string;
  gist: string;
  hook: string;
  artId: string;
  lines: { zh: string; en: string; pinyin: string }[];
  notes: { term: string; zh: string; en: string }[];
  polyphonic: { char: string; reading: string; note: string }[];
  charCount: number;
  stage: number;
  bestCloze: number;
  bestRecite: number;
}

const STAGE_LABELS = ['Locked', 'Heard', 'Understood', 'Recalled', 'Activated'];

export default function Relics() {
  const [relics, setRelics] = useState<Relic[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/relics')
      .then((r) => r.json())
      .then((b) => setRelics(Array.isArray(b?.relics) ? b.relics : []))
      .catch(() => setRelics([]));
  }, []);

  const open = relics.find((r) => r.id === openId) ?? null;

  async function bump(relicId: string, patch: Partial<Relic> & { stage?: number; clozeScore?: number; reciteScore?: number }) {
    const res = await fetch('/api/relics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ relicId, ...patch }),
    });
    const b = await res.json();
    if (b.stage >= 4) sfx('unlock');
    setRelics((rs) =>
      rs.map((r) =>
        r.id === relicId
          ? { ...r, stage: b.stage, bestCloze: b.bestCloze, bestRecite: b.bestRecite }
          : r,
      ),
    );
  }

  if (open) return <RelicDetail relic={open} onClose={() => setOpenId(null)} onProgress={bump} />;

  const byYear = [1, 2, 3].map((y) => ({ year: y, items: relics.filter((r) => r.year === y) }));

  return (
    <main className="min-h-dvh px-4 py-5 max-w-3xl mx-auto pb-16">
      <header className="flex items-center gap-3 mb-2">
        <Link href="/play" className="btn btn-ghost px-2.5 py-1 text-xs">←</Link>
        <h1 className="text-xl font-bold">古诗文 Relics</h1>
      </header>
      <p className="text-sm text-[var(--color-slate-soft)] mb-6 leading-relaxed">
        These fourteen are the exact 默写 list named in the 初中统考 考试纲要. Not a selection — the
        list. Activate one by reciting it from memory.
      </p>

      {byYear.map(({ year, items }) => (
        <section key={year} className="mb-8">
          <h2 className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)] mb-3">
            初{['一', '二', '三'][year - 1]} · {items.filter((r) => r.stage >= 4).length}/{items.length} activated
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((r) => (
              <button
                key={r.id}
                onClick={() => setOpenId(r.id)}
                className={`card-face ${r.stage >= 4 ? 'r-legendary' : r.stage > 0 ? 'r-rare' : 'r-common'} rounded-xl p-4 text-left transition hover:brightness-110`}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#111925]">
                    <ArtImage id={r.artId} alt="" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="zh-display text-lg truncate">{r.title}</div>
                    <div className="text-xs text-[var(--color-slate-soft)] truncate">
                      {r.author} · {r.dynasty}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--rarity)' }}>
                      {STAGE_LABELS[r.stage]} · {r.charCount} 字
                    </div>
                  </div>
                </div>
                <div className="progress mt-3">
                  <i style={{ width: `${(r.stage / 4) * 100}%` }} />
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function RelicDetail({
  relic,
  onClose,
  onProgress,
}: {
  relic: Relic;
  onClose: () => void;
  onProgress: (id: string, patch: { stage?: number; clozeScore?: number; reciteScore?: number }) => void;
}) {
  const [tab, setTab] = useState<'read' | 'recall' | 'recite'>('read');
  const [activeLine, setActiveLine] = useState(-1);
  const { speak } = useSpeak();

  const fullText = useMemo(() => relic.lines.map((l) => l.zh).join(''), [relic]);

  async function readAll() {
    for (let i = 0; i < relic.lines.length; i++) {
      setActiveLine(i);
      await new Promise<void>((resolve) =>
        speak(relic.lines[i].zh, 'elder', { onEnd: () => resolve() }),
      );
    }
    setActiveLine(-1);
    if (relic.stage < 1) onProgress(relic.id, { stage: 1 });
  }

  return (
    <main className="min-h-dvh px-4 py-5 max-w-2xl mx-auto pb-20">
      <header className="flex items-center gap-3 mb-4">
        <button className="btn btn-ghost px-2.5 py-1 text-xs" onClick={onClose}>←</button>
        <div className="min-w-0">
          <div className="zh-display text-xl truncate">{relic.title}</div>
          <div className="text-xs text-[var(--color-slate-soft)]">
            {relic.author} · {relic.dynasty} · {relic.form} · {relic.book} {relic.lesson}
          </div>
        </div>
      </header>

      <div className="aspect-[2/1] rounded-xl overflow-hidden mb-5 bg-[#111925]">
        <ArtImage id={relic.artId} alt="" className="w-full h-full" />
      </div>

      <div className="flex gap-1.5 mb-5">
        {(['read', 'recall', 'recite'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn px-3 py-1.5 text-xs ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t === 'read' ? '1 · Read' : t === 'recall' ? '2 · Recall' : '3 · Recite'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'read' && (
          <motion.section key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="btn btn-primary w-full mb-4" onClick={readAll}>
              ▶ Play the whole poem
            </button>

            <div className="surface-paper p-5 space-y-3">
              {relic.lines.map((l, i) => (
                <div
                  key={i}
                  className={`cursor-pointer ${activeLine === i ? 'opacity-100' : 'opacity-90'}`}
                  onClick={() => void speak(l.zh, 'elder')}
                >
                  <div className="text-[11px] text-[var(--color-slate)] tracking-wide">{l.pinyin}</div>
                  <div
                    className={`zh-display text-xl text-[var(--color-ink)] ${activeLine === i ? 'syl-on' : ''}`}
                  >
                    {l.zh}
                  </div>
                  <div className="text-sm text-[var(--color-slate)] mt-0.5">{l.en}</div>
                </div>
              ))}
            </div>

            <div className="surface p-4 mt-4">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)] mb-2">
                What it is about
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-paper-dim)]">{relic.gist}</p>
              <p className="text-sm leading-relaxed text-[var(--color-gold)] mt-3">{relic.hook}</p>
            </div>

            {relic.polyphonic.length > 0 && (
              <div className="surface p-4 mt-3 border-[var(--color-cinnabar)]/40">
                <h3 className="text-xs uppercase tracking-wider text-[var(--color-cinnabar)] mb-2">
                  多音字 traps
                </h3>
                {relic.polyphonic.map((p) => (
                  <p key={p.char} className="text-sm mb-1.5">
                    <span className="zh text-lg mr-2">{p.char}</span>
                    <b className="text-[var(--color-jade-bright)]">{p.reading}</b>
                    <span className="zh block text-xs text-[var(--color-slate-soft)] mt-0.5">
                      {p.note}
                    </span>
                  </p>
                ))}
              </div>
            )}

            <div className="surface p-4 mt-3">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)] mb-2">
                注释 · 文言实词
              </h3>
              <dl className="space-y-1.5">
                {relic.notes.map((n) => (
                  <div key={n.term} className="text-sm">
                    <dt className="zh inline font-semibold">{n.term}</dt>
                    <dd className="inline text-[var(--color-slate-soft)]">
                      {' '}
                      — <span className="zh">{n.zh}</span> · {n.en}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <button
              className="btn btn-ghost w-full mt-5"
              onClick={() => {
                onProgress(relic.id, { stage: Math.max(relic.stage, 2) });
                setTab('recall');
              }}
            >
              I understand it → Recall
            </button>
          </motion.section>
        )}

        {tab === 'recall' && (
          <Cloze
            key="recall"
            relic={relic}
            onScore={(score) => {
              onProgress(relic.id, {
                clozeScore: score,
                stage: score >= 0.8 ? Math.max(relic.stage, 3) : relic.stage,
              });
            }}
          />
        )}

        {tab === 'recite' && (
          <motion.section key="recite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-sm text-[var(--color-slate-soft)] mb-4 leading-relaxed">
              Recite it from memory to activate the relic. You do not have to be perfect — the app
              compares what it heard to the poem and tells you which lines slipped.
            </p>
            <Recorder
              targetText={fullText}
              onResult={async (transcript) => {
                const res = await fetch('/api/speech/score', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ target: fullText, transcript }),
                });
                const b = await res.json();
                const score = b.score?.overall ?? 0;
                onProgress(relic.id, {
                  reciteScore: score,
                  stage: score >= 0.75 ? 4 : relic.stage,
                });
              }}
            />
            {relic.bestRecite > 0 && (
              <p className="text-center text-sm mt-5">
                Best so far:{' '}
                <b className="text-[var(--color-jade-bright)]">
                  {Math.round(relic.bestRecite * 100)}%
                </b>
                {relic.stage >= 4 && (
                  <span className="block text-[var(--color-gold)] mt-1">Relic activated ✦</span>
                )}
              </p>
            )}
            <div className="mt-6">
              <Speak text={fullText} speaker="elder" label="Hear it once more" className="w-full" />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

/**
 * 默写 practice. Blanks scale with stage: the more of the poem you have proved
 * you hold, the more of it gets taken away.
 */
function Cloze({ relic, onScore }: { relic: Relic; onScore: (score: number) => void }) {
  const blankRate = relic.stage >= 3 ? 0.4 : 0.2;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const blanks = useMemo(() => {
    const out: { key: string; line: number; index: number; char: string }[] = [];
    relic.lines.forEach((l, li) => {
      const chars = [...l.zh].filter((c) => /[一-鿿]/u.test(c));
      const n = Math.max(1, Math.round(chars.length * blankRate));
      // Deterministic per relic so the same blanks come back on a refresh.
      const step = Math.max(1, Math.floor(chars.length / n));
      for (let k = 0; k < n; k++) {
        const idx = Math.min(chars.length - 1, k * step + (li % step));
        out.push({ key: `${li}-${idx}`, line: li, index: idx, char: chars[idx] });
      }
    });
    return out;
  }, [relic, blankRate]);

  const blankSet = new Set(blanks.map((b) => b.key));

  function check() {
    setChecked(true);
    const right = blanks.filter((b) => (answers[b.key] ?? '').trim() === b.char).length;
    sfx(right === blanks.length ? 'complete' : right > blanks.length / 2 ? 'correct' : 'wrong');
    onScore(blanks.length ? right / blanks.length : 0);
  }

  const right = blanks.filter((b) => (answers[b.key] ?? '').trim() === b.char).length;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <p className="text-sm text-[var(--color-slate-soft)] mb-4">
        Fill the gaps. {blanks.length} blanks.
      </p>
      <div className="surface-paper p-5 space-y-4">
        {relic.lines.map((l, li) => {
          let hanziIdx = -1;
          return (
            <p key={li} className="zh-display text-xl text-[var(--color-ink)] leading-loose">
              {[...l.zh].map((ch, ci) => {
                if (!/[一-鿿]/u.test(ch)) return <span key={ci}>{ch}</span>;
                hanziIdx += 1;
                const key = `${li}-${hanziIdx}`;
                if (!blankSet.has(key)) return <span key={ci}>{ch}</span>;
                const val = answers[key] ?? '';
                const ok = checked && val.trim() === ch;
                return (
                  <input
                    key={ci}
                    value={val}
                    maxLength={1}
                    disabled={checked}
                    onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
                    className={`zh inline-block w-9 text-center mx-0.5 border-b-2 bg-transparent outline-none ${
                      checked
                        ? ok
                          ? 'border-[var(--color-jade)] text-[var(--color-jade)]'
                          : 'border-[var(--color-cinnabar)] text-[var(--color-cinnabar)]'
                        : 'border-[var(--color-slate)] focus:border-[var(--color-jade)]'
                    }`}
                  />
                );
              })}
            </p>
          );
        })}
      </div>

      {!checked ? (
        <button className="btn btn-primary w-full mt-5" onClick={check}>
          Check
        </button>
      ) : (
        <div className="mt-5 text-center">
          <p className="text-2xl font-bold text-[var(--color-jade-bright)]">
            {right} / {blanks.length}
          </p>
          {right < blanks.length && (
            <p className="text-sm text-[var(--color-slate-soft)] mt-2">
              Missed:{' '}
              <span className="zh">
                {blanks
                  .filter((b) => (answers[b.key] ?? '').trim() !== b.char)
                  .map((b) => b.char)
                  .join(' ')}
              </span>
            </p>
          )}
          <button
            className="btn btn-ghost mt-4"
            onClick={() => {
              setChecked(false);
              setAnswers({});
            }}
          >
            Try again
          </button>
        </div>
      )}
    </motion.section>
  );
}
