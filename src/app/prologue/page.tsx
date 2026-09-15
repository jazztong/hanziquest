'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ItemCard, { type Feedback } from '@/components/ItemCard';
import type { PublicItem } from '@/lib/items/public';
import SoundToggle from '@/components/SoundToggle';
import SpeedToggle from '@/components/SpeedToggle';
import { Screen, Loading, Progress } from '@/components/ui';
import { sfx } from '@/lib/sfx';
import { boundedAdvance, type Gate } from '@/lib/feedback-voice';

interface Stage {
  id: string;
  titleZh: string;
  titleEn: string;
  blurb: string;
  count: number;
  minutes: number;
}

interface BaselineResult {
  skills: {
    skill: string;
    hskLevel: number;
    percentOfTarget: number;
    accuracy: number;
    summaryEn: string;
  }[];
  estimatedChars: number;
  gaps: { tag: string; label: string; labelEn: string; misses: number }[];
  storyBand: number;
  overallPercent: number;
  minutesTaken: number;
}

export default function Prologue() {
  const router = useRouter();
  const [runId, setRunId] = useState('');
  const [item, setItem] = useState<PublicItem | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 1, pct: 0 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [result, setResult] = useState<BaselineResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showStageCard, setShowStageCard] = useState(true);
  const [resumed, setResumed] = useState(false);
  const startedAt = useRef(Date.now());
  // The pending advance. Held in a ref so the spoken-verdict callback coming
  // back from ItemCard can release the same gate the answer handler opened.
  const gate = useRef<Gate | null>(null);

  // Leaving mid-question must not leave a timer pointed at a screen that has
  // gone: the advance would fire into an unmounted tree.
  useEffect(() => () => gate.current?.cancel(), []);

  // ItemCard owns the speaking, this screen owns the advancing, so the verdict
  // finishing has to travel back up. Stable identity: ItemCard watches this in
  // an effect, and a new function every render would churn it.
  const onSpoken = useCallback(() => gate.current?.finished(), []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/baseline/start', { method: 'POST' });
      const b = await res.json();
      setRunId(b.runId);
      setItem(b.item);
      setStage(b.stage);
      setStages(b.stages);
      setStageIndex(b.stageIndex);
      setProgress(b.progress);
      setResumed(b.resumed);
    })();
  }, []);

  const answer = useCallback(
    async (value: string) => {
      if (!runId || busy) return;
      setBusy(true);
      const res = await fetch('/api/baseline/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId, value, elapsedMs: Date.now() - startedAt.current }),
      });
      const b = await res.json();
      setBusy(false);
      if (b.error) return;
      setFeedback(b.feedback);
      setProgress(b.progress);

      // Hold the feedback long enough to read it, then move on. Wrong answers
      // hold longest, because that is when the explanation matters most.
      //
      // This used to be a flat timer sized by guessing how long the reveal
      // takes to say aloud. It is bounded instead now: the floor is how long
      // the card needs to be *read*, and the advance then waits past it until
      // the voice reports finishing - up to a ceiling, so a browser with no
      // zh-CN voice (which may never report anything) cannot stall the run.
      const hasReveal = Boolean(b.feedback.reveal);
      const floor =
        b.feedback.correct === false ? (hasReveal ? 3200 : 2600) : hasReveal ? 1800 : 1100;
      const ceiling = b.feedback.correct === false ? 6000 : 4500;
      gate.current?.cancel();
      gate.current = boundedAdvance(() => {
        setFeedback(null);
        startedAt.current = Date.now();
        if (b.done) {
          sfx('complete');
          setResult(b.result);
          return;
        }
        if (b.stageChanged) {
          setStage(b.stage);
          setStageIndex(b.stageIndex);
          setShowStageCard(true);
        }
        setItem(b.item);
      }, floor, ceiling);
    },
    [runId, busy],
  );

  if (result) return <ResultScreen result={result} onGo={() => router.push('/play')} />;

  if (!item && !stage) return <Loading what="Opening the prologue…" />;

  return (
    <Screen>
      <header className="mb-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-slate-soft)] mb-2">
          <span className="uppercase tracking-wider min-w-0 truncate">
            Prologue · {stage?.titleEn ?? ''}
          </span>
          <span className="flex items-center gap-2 shrink-0 tabular-nums">
            {progress.done} / {progress.total}
            <SpeedToggle />
            <SoundToggle />
          </span>
        </div>
        <Progress value={progress.pct} />
      </header>

      <AnimatePresence mode="wait">
        {showStageCard && stage ? (
          <motion.section
            key={`stage-${stageIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="surface p-5 sm:p-7 text-center"
          >
            {resumed && stageIndex > 0 && (
              <p className="pill mb-4">Picking up where you stopped</p>
            )}
            <div className="zh-display text-3xl sm:text-4xl text-[var(--color-gold)] break-words">
              {stage.titleZh}
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-2 break-words">{stage.titleEn}</h2>
            <p className="text-sm text-[var(--color-slate-soft)] mt-3 leading-relaxed max-w-sm mx-auto">
              {stage.blurb}
            </p>
            <p className="text-xs text-[var(--color-slate)] mt-4">
              {stage.count} {stage.count === 1 ? 'task' : 'tasks'} · about {stage.minutes} min
            </p>
            <button
              className="btn btn-primary mt-6 px-8 min-h-11 w-full sm:w-auto"
              onClick={() => {
                sfx('unlock');
                setShowStageCard(false);
                startedAt.current = Date.now();
              }}
            >
              Go
            </button>
            {stageIndex > 0 && (
              <p className="text-[11px] text-[var(--color-slate)] mt-4">
                You can close this and come back — nothing is lost.
              </p>
            )}
          </motion.section>
        ) : item ? (
          <ItemCard
            key={item.id}
            item={item}
            feedback={feedback}
            onAnswer={answer}
            busy={busy}
            onSpoken={onSpoken}
          />
        ) : null}
      </AnimatePresence>
    </Screen>
  );
}

const SKILL_LABEL: Record<string, string> = {
  recognition: '识字 Recognition',
  pinyinTone: '拼音声调 Pinyin & tones',
  vocabulary: '词语 Vocabulary',
  readAloud: '朗读 Reading aloud',
  comprehension: '阅读理解 Comprehension',
  handwriting: '书写 Handwriting',
  languageKnowledge: '语文基础 Language knowledge',
  writing: '写作 Writing',
};

function ResultScreen({ result, onGo }: { result: BaselineResult; onGo: () => void }) {
  return (
    <Screen>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="pill">Prologue complete · {result.minutesTaken} min</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-3">Here is where you actually are.</h1>
        <p className="text-sm text-[var(--color-slate-soft)] mt-2 leading-relaxed">
          Nothing here is a grade. It is the starting map — every chapter from now on is pitched at
          these numbers, and they move every week.
        </p>

        <div className="surface p-4 sm:p-5 mt-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl sm:text-5xl font-bold text-[var(--color-jade-bright)] tabular-nums">
              {result.estimatedChars}
            </span>
            <span className="text-sm text-[var(--color-slate-soft)]">
              characters you can read on sight
            </span>
          </div>
          <Progress value={Math.min(100, (result.estimatedChars / 2500) * 100)} className="mt-4" />
          <p className="text-xs text-[var(--color-slate)] mt-2">
            初一 assumes about 2,500 — that is the gap this game exists to close.
          </p>
        </div>

        <h2 className="text-lg font-bold mt-8 mb-3">Skill by skill</h2>
        <div className="space-y-2.5">
          {result.skills.map((s) => (
            <div key={s.skill} className="surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold min-w-0">
                  {SKILL_LABEL[s.skill] ?? s.skill}
                </span>
                <span className="text-xs text-[var(--color-slate-soft)] whitespace-nowrap">
                  HSK {s.hskLevel} · {Math.round(s.percentOfTarget)}% of 初一
                </span>
              </div>
              <Progress value={Math.min(100, s.percentOfTarget)} className="mt-2" />
              <p className="text-xs text-[var(--color-slate-soft)] mt-2 leading-relaxed">
                {s.summaryEn}
              </p>
            </div>
          ))}
        </div>

        {result.gaps.length > 0 && (
          <>
            <h2 className="text-lg font-bold mt-8 mb-1">What to fix first</h2>
            <p className="text-xs text-[var(--color-slate-soft)] mb-3">
              Ranked by how much it costs you in the 统考, not by how often you got it wrong.
            </p>
            <ol className="space-y-2">
              {result.gaps.slice(0, 6).map((g, i) => (
                <li key={g.tag} className="surface p-3 flex items-start gap-3">
                  <span className="text-[var(--color-gold)] font-bold w-5 shrink-0">{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="zh text-sm break-words">{g.label}</span>
                    <span className="block text-xs text-[var(--color-slate-soft)] break-words">
                      {g.labelEn}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        <button className="btn btn-primary w-full mt-8 py-3.5 min-h-11" onClick={onGo}>
          Start chapter one
        </button>
      </motion.div>
    </Screen>
  );
}
