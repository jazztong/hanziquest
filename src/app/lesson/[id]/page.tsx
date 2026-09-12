'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import HanziText from '@/components/HanziText';
import HanziPad from '@/components/HanziPad';
import SoundToggle from '@/components/SoundToggle';
import Speak, { useSpeak } from '@/components/Speak';
import { sfx } from '@/lib/sfx';
import type { PublicItem } from '@/lib/items/public';

/**
 * 课文 side quest: pre-teach → karaoke reading → 统考-style questions.
 *
 * The three stages mirror how the lesson is actually taught in class, in the
 * order a teacher would use them - meet the words, read the text aloud, then
 * answer questions on it. Doing questions before the reading would test
 * guessing.
 */

interface PreTeachWord {
  w: string;
  pinyin: string;
  gloss: string;
  band: number | null;
  count: number;
  newChars: string[];
}
interface ReadingLine { id: string; zh: string; pinyin: string; para: number }
interface Quest {
  title: string;
  bookRef: string;
  preTeach: PreTeachWord[];
  lines: ReadingLine[];
  items: PublicItem[];
  stats: { chars: number; distinctChars: number; sentences: number; meanSentence: number; knownShare: number };
  error?: string;
}

type Stage = 'intro' | 'preteach' | 'read' | 'quiz' | 'done';

export default function LessonQuest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('intro');

  useEffect(() => {
    fetch(`/api/lesson/quest?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((b) => (b?.error || !Array.isArray(b?.lines) ? setError(b?.error ?? 'Could not build this quest.') : setQuest(b)))
      .catch(() => setError('Could not reach the server.'));
  }, [id]);

  if (error) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div>
          <p className="text-[var(--color-cinnabar)] font-semibold">{error}</p>
          <Link href="/play" className="btn btn-primary mt-5">Back to the map</Link>
        </div>
      </main>
    );
  }
  if (!quest) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <p className="text-[var(--color-slate-soft)]">Building the quest…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-5 max-w-2xl mx-auto pb-24">
      <header className="flex items-center gap-3 mb-5">
        <Link href="/play" className="btn btn-ghost px-2.5 py-1 text-xs">←</Link>
        <div className="min-w-0 flex-1">
          <div className="zh text-sm truncate">{quest.title}</div>
          <div className="text-[11px] text-[var(--color-slate)] truncate">{quest.bookRef || '课文'}</div>
        </div>
        <SoundToggle />
      </header>

      <AnimatePresence mode="wait">
        {stage === 'intro' && <Intro key="i" quest={quest} onGo={() => { sfx('unlock'); setStage(quest.preTeach.length ? 'preteach' : 'read'); }} />}
        {stage === 'preteach' && <PreTeach key="p" words={quest.preTeach} onDone={() => setStage('read')} />}
        {stage === 'read' && <Reading key="r" quest={quest} onDone={() => setStage(quest.items.length ? 'quiz' : 'done')} />}
        {stage === 'quiz' && <Quiz key="q" items={quest.items} onDone={() => { sfx('complete'); setStage('done'); }} />}
        {stage === 'done' && <Done key="d" />}
      </AnimatePresence>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      {children}
    </motion.section>
  );
}

function Intro({ quest, onGo }: { quest: Quest; onGo: () => void }) {
  const pct = Math.round(quest.stats.knownShare * 100);
  // Before the prologue there are no cards, so knownShare is 0. Telling a
  // student he can read 0% of his own lesson is both untrue and discouraging -
  // it means "not measured yet", not "knows nothing".
  const measured = quest.stats.knownShare > 0;
  return (
    <Panel>
      <div className="surface p-6">
        <p className="pill">课文 side quest</p>
        <h1 className="zh-display text-2xl mt-3">{quest.title}</h1>
        <div className="grid grid-cols-3 gap-3 mt-5 text-center">
          <Stat n={quest.stats.chars} label="字" sub="in the lesson" />
          <Stat n={measured ? `${pct}%` : '—'} label="you can read" sub={measured ? 'already' : 'do the prologue'} />
          <Stat n={quest.preTeach.length} label="new words" sub="to meet first" />
        </div>
        <p className="text-sm text-[var(--color-slate-soft)] mt-5 leading-relaxed">
          {!measured
            ? 'Your reading level has not been measured yet, so this quest is pitched at the lesson rather than at you. Finish the prologue and it will fit better.'
            : pct >= 90
            ? 'You can already read most of this. The quest is about meaning and detail, not decoding.'
            : pct >= 75
              ? 'A fair bit of this is new. Meet the words first and the reading gets much easier.'
              : 'This one is a stretch. Take the words slowly — there is no clock on any of it.'}
        </p>
        <button className="btn btn-primary w-full mt-6" onClick={onGo}>
          Start
        </button>
      </div>
      <p className="text-[11px] text-[var(--color-slate)] mt-4 text-center leading-relaxed">
        Built from the lesson your parent uploaded. It stays on this machine.
      </p>
    </Panel>
  );
}

function Stat({ n, label, sub }: { n: number | string; label: string; sub: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-[var(--color-jade-bright)]">{n}</div>
      <div className="text-[11px] text-[var(--color-paper-dim)]">{label}</div>
      <div className="text-[10px] text-[var(--color-slate)]">{sub}</div>
    </div>
  );
}

function PreTeach({ words, onDone }: { words: PreTeachWord[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const w = words[i];
  const last = i === words.length - 1;
  if (!w) { onDone(); return null; }

  return (
    <Panel>
      <p className="pill mb-3">生字新词 · {i + 1} / {words.length}</p>
      <div className="surface p-6 text-center">
        <div className="zh-display text-6xl leading-tight">{w.w}</div>
        <div className="text-xl font-semibold text-[var(--color-jade-bright)] mt-3">{w.pinyin}</div>
        <p className="text-sm text-[var(--color-paper-dim)] mt-2">{w.gloss || '—'}</p>
        <p className="text-[11px] text-[var(--color-slate)] mt-1">
          {w.band ? `HSK band ${w.band} · ` : ''}appears {w.count}× in this lesson
        </p>
        <div className="mt-4"><Speak text={w.w} speaker="system" label="Hear it" /></div>

        {w.newChars.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#2a3648]">
            <p className="text-xs text-[var(--color-slate-soft)] mb-3">
              New character{w.newChars.length > 1 ? 's' : ''} to write: {w.newChars.join(' ')}
            </p>
            <HanziPad char={w.newChars[0]} size={190} onDone={() => sfx('correct')} />
          </div>
        )}
      </div>
      <button
        className="btn btn-primary w-full mt-5"
        onClick={() => { sfx('page'); last ? onDone() : setI((n) => n + 1); }}
      >
        {last ? 'Read the lesson' : 'Next word'}
      </button>
    </Panel>
  );
}

function Reading({ quest, onDone }: { quest: Quest; onDone: () => void }) {
  const [active, setActive] = useState(-1);
  const [showPinyin, setShowPinyin] = useState(true);
  const [playingAll, setPlayingAll] = useState(false);
  const { speak, stop } = useSpeak();
  const cancelled = useRef(false);

  useEffect(() => () => { cancelled.current = true; stop(); }, [stop]);

  const playAll = useCallback(async () => {
    setPlayingAll(true);
    for (let i = 0; i < quest.lines.length; i++) {
      if (cancelled.current) break;
      setActive(i);
      await new Promise<void>((res) => speak(quest.lines[i].zh, 'narrator', { onEnd: () => res() }));
    }
    setActive(-1);
    setPlayingAll(false);
  }, [quest.lines, speak]);

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        <button className="btn btn-primary flex-1" onClick={playingAll ? () => { cancelled.current = true; stop(); setPlayingAll(false); setActive(-1); } : playAll}>
          {playingAll ? '◼ Stop' : '▶ Read the whole lesson'}
        </button>
        <button className="btn btn-ghost text-xs" onClick={() => setShowPinyin((p) => !p)}>
          {showPinyin ? '拼音 on' : '拼音 off'}
        </button>
      </div>

      <div className="surface-paper p-5 space-y-3 max-h-[55vh] overflow-y-auto">
        {quest.lines.map((l, i) => (
          <div
            key={l.id}
            onClick={() => { setActive(i); void speak(l.zh, 'narrator', { onEnd: () => setActive(-1) }); }}
            className={`cursor-pointer rounded px-1 -mx-1 ${active === i ? 'bg-[rgb(31_138_128/0.15)]' : ''}`}
          >
            {showPinyin && (
              <div className="text-[11px] text-[var(--color-slate)] tracking-wide">{l.pinyin}</div>
            )}
            <div className="zh text-[17px] text-[var(--color-ink)]">
              <HanziText text={l.zh} support="full" />
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary w-full mt-5" onClick={() => { sfx('page'); onDone(); }}>
        I have read it — questions
      </button>
    </Panel>
  );
}

function Quiz({ items, onDone }: { items: PublicItem[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [result, setResult] = useState<{ correct: boolean; explainEn: string; explainZh: string } | null>(null);
  const [right, setRight] = useState(0);
  const startedAt = useRef(Date.now());
  const item = items[i];

  useEffect(() => { startedAt.current = Date.now(); setResult(null); }, [i]);

  async function answer(value: string) {
    if (result) return;
    sfx('select');
    const res = await fetch('/api/lesson/answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, value, elapsedMs: Date.now() - startedAt.current }),
    });
    const b = await res.json();
    setResult(b);
    sfx(b.correct ? 'correct' : 'wrong');
    if (b.correct) setRight((n) => n + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onDone();
      else setI((n) => n + 1);
    }, b.correct ? 1100 : 2800);
  }

  if (!item) { onDone(); return null; }

  return (
    <Panel>
      <div className="flex items-center justify-between text-xs text-[var(--color-slate-soft)] mb-2">
        <span>统考题型 · {i + 1} / {items.length}</span>
        <span>{right} correct</span>
      </div>
      <div className="progress mb-4"><i style={{ width: `${((i + 1) / items.length) * 100}%` }} /></div>

      <div className="surface p-5">
        <div className="zh text-lg leading-relaxed whitespace-pre-line">
          <HanziText text={item.stem} support="full" />
        </div>
        {item.stemEn && <p className="text-sm text-[var(--color-slate-soft)] mt-3">{item.stemEn}</p>}
        {item.audioText && <div className="mt-3"><Speak text={item.audioText} speaker="narrator" label="Hear the sentence" /></div>}

        <div className="grid gap-2 mt-5">
          {(item.options ?? []).map((o) => (
            <button
              key={o.id}
              disabled={Boolean(result)}
              onClick={() => answer(o.id)}
              className="btn btn-choice"
            >
              {o.zh && <span className="zh text-lg mr-2">{o.zh}</span>}
              {o.pinyin && <span className="text-lg font-semibold text-[var(--color-jade-bright)] mr-2">{o.pinyin}</span>}
              {o.en && <span className="text-sm text-[var(--color-paper-dim)]">{o.en}</span>}
            </button>
          ))}
        </div>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-[#2a3648]">
            <p className={`font-semibold ${result.correct ? 'text-[var(--color-jade-bright)]' : 'text-[var(--color-cinnabar)]'}`}>
              {result.correct ? '对了' : '再想想'}
            </p>
            {result.explainEn && <p className="text-sm mt-1.5 text-[var(--color-paper-dim)]">{result.explainEn}</p>}
            {result.explainZh && <p className="zh text-sm mt-1 text-[var(--color-slate-soft)]">{result.explainZh}</p>}
          </motion.div>
        )}
      </div>
    </Panel>
  );
}

function Done() {
  return (
    <Panel>
      <div className="text-center py-10">
        <div className="text-5xl mb-4" aria-hidden>📚</div>
        <h1 className="text-2xl font-bold">课文 done.</h1>
        <p className="text-sm text-[var(--color-slate-soft)] mt-2 leading-relaxed max-w-sm mx-auto">
          Anything you missed has gone into the daily session, so it comes back before the exam
          rather than after it.
        </p>
        <div className="flex gap-2 mt-7 max-w-sm mx-auto">
          <Link href="/deck" className="btn btn-ghost flex-1">识字 deck</Link>
          <Link href="/play" className="btn btn-primary flex-1">Back to the map</Link>
        </div>
      </div>
    </Panel>
  );
}
