'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeak } from '@/components/Speak';
import SoundToggle from '@/components/SoundToggle';
import { sfx, playStreak } from '@/lib/sfx';
import type { PublicItem } from '@/lib/items/public';
import { Screen, Centred, Loading, PageHeader, Progress, OptionList } from '@/components/ui';

/** The arcade adds `subject` so an answer can be marked without round state. */
type ArcadeItem = PublicItem & { subject: string };

/**
 * 拼音/声调 arcade.
 *
 * Timed, scored, and built from the player's own logged tone confusions. The
 * clock is per-question and generous (8s) rather than a single round timer:
 * a round timer punishes the slow question you got right, which is the opposite
 * of what a tone drill should reinforce.
 */

const PER_QUESTION_MS = 8000;

interface Round {
  items: ArcadeItem[];
  targetedPairs: string[];
  personalBest: number;
  band: number;
}

export default function Arcade() {
  const [round, setRound] = useState<Round | null>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [remaining, setRemaining] = useState(PER_QUESTION_MS);
  const [result, setResult] = useState<{ correct: boolean; answer: string; explainEn: string } | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const { speak } = useSpeak();

  const load = useCallback(() => {
    setRound(null);
    setI(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setDone(false);
    setResult(null);
    setError(null);
    fetch('/api/arcade')
      .then((r) => r.json())
      .then((b) => {
        // An error body has no `items`, and storing it as a round crashes the
        // first render. Always check before trusting the shape.
        if (b?.error || !Array.isArray(b?.items)) {
          setError(b?.error ?? 'Could not build a round.');
          return;
        }
        setRound(b);
        startedAt.current = Date.now();
        setRemaining(PER_QUESTION_MS);
      })
      .catch(() => setError('Could not reach the server.'));
  }, []);

  useEffect(load, [load]);

  const item = round?.items[i];

  // Listening items play automatically - the audio is the question.
  useEffect(() => {
    if (!item) return;
    startedAt.current = Date.now();
    setRemaining(PER_QUESTION_MS);
    if (item.type === 'listen-char' || item.type === 'tone-discriminate') {
      const t = setTimeout(() => void speak(item.audioText ?? item.stem, 'system'), 200);
      return () => clearTimeout(t);
    }
  }, [item, speak]);

  const answer = useCallback(
    async (chosen: string) => {
      if (!item || result) return;
      const elapsedMs = Date.now() - startedAt.current;
      const res = await fetch('/api/arcade', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject: item.subject, type: item.type, chosen, elapsedMs }),
      });
      const b = await res.json();
      setResult(b);

      if (b.correct) sfx('correct');
      else sfx('wrong');

      if (b.correct) {
        // Faster answers are worth more, floored so a slow-but-right answer
        // still scores. Speed is a bonus, never the point.
        const speedBonus = Math.max(0, Math.round((1 - elapsedMs / PER_QUESTION_MS) * 50));
        setScore((s) => s + 50 + speedBonus + streak * 5);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b2) => Math.max(b2, next));
          if (next >= 3) playStreak(next);
          return next;
        });
      } else {
        setStreak(0);
      }

      setTimeout(() => {
        setResult(null);
        if (i + 1 >= (round?.items.length ?? 0)) {
          sfx('complete');
          setDone(true);
        } else setI((n) => n + 1);
      }, b.correct ? 700 : 2200);
    },
    [item, result, i, round, streak],
  );

  // Per-question clock. Running out counts as a miss, not a penalty.
  useEffect(() => {
    if (!item || result || done) return;
    let lastTickSecond = -1;
    const id = setInterval(() => {
      const left = PER_QUESTION_MS - (Date.now() - startedAt.current);
      setRemaining(left);
      // Tick only in the last three seconds. A tick under every question is
      // just stress; a tick when time is nearly gone is information.
      const second = Math.ceil(left / 1000);
      if (left > 0 && second <= 3 && second !== lastTickSecond) {
        lastTickSecond = second;
        sfx('tick');
      }
      if (left <= 0) void answer('');
    }, 100);
    return () => clearInterval(id);
  }, [item, result, done, answer]);

  if (error) {
    return (
      <Centred>
        <p className="text-[var(--color-cinnabar)] font-semibold text-balance">{error}</p>
        <p className="text-sm text-[var(--color-slate-soft)] mt-2 leading-relaxed">
          If you have been signed out, sign in again and come back.
        </p>
        <div className="flex gap-2 mt-6">
          <Link href="/login" className="btn btn-ghost flex-1">Sign in</Link>
          <button className="btn btn-primary flex-1" onClick={load}>Retry</button>
        </div>
      </Centred>
    );
  }

  if (!round) return <Loading what="Loading the arcade…" />;

  if (done) {
    const isBest = score > round.personalBest;
    return (
      <Centred>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-5xl mb-3" aria-hidden>🎯</div>
          <p className="text-5xl font-bold text-[var(--color-jade-bright)] tabular-nums">{score}</p>
          {isBest && <p className="text-[var(--color-gold)] font-semibold mt-2">New personal best!</p>}
          <p className="text-sm text-[var(--color-slate-soft)] mt-3 text-balance">
            Best streak {bestStreak} · previous best {round.personalBest}
          </p>
          <div className="flex gap-2 mt-7">
            <Link href="/play" className="btn btn-ghost flex-1">Map</Link>
            <button className="btn btn-primary flex-1" onClick={load}>Again</button>
          </div>
        </motion.div>
      </Centred>
    );
  }

  if (!item) return null;

  const pct = Math.max(0, Math.min(100, (remaining / PER_QUESTION_MS) * 100));
  const listening = item.type === 'listen-char' || item.type === 'tone-discriminate';

  return (
    <Screen width="narrow">
      <PageHeader
        back="/play"
        title={
          <span className="text-xs font-normal text-[var(--color-slate-soft)] tabular-nums">
            {i + 1}/{round.items.length}
          </span>
        }
        right={
          <>
            <span className="text-lg font-bold text-[var(--color-jade-bright)] tabular-nums">
              {score}
            </span>
            {streak >= 2 && (
              <span className="text-xs text-[var(--color-gold)] font-semibold whitespace-nowrap">
                🔥 {streak}
              </span>
            )}
            <SoundToggle className="min-w-[44px] min-h-[44px]" />
          </>
        }
      />

      {/* Per-question clock */}
      <Progress
        value={pct}
        tone={
          pct < 25
            ? 'linear-gradient(90deg,#C8442F,#E0A33E)'
            : 'linear-gradient(90deg,#1F8A80,#2CB3A6)'
        }
        className="mb-5 [&>i]:transition-[width] [&>i]:duration-100 [&>i]:ease-linear"
      />

      {round.targetedPairs.length > 0 && i === 0 && (
        <p className="text-[11px] text-center text-[var(--color-slate)] mb-4 break-words">
          Built from the tones you have been missing: {round.targetedPairs.join(', ')}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={item.subject + i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          className="surface p-4 sm:p-6"
        >
          {listening ? (
            <div className="text-center py-6">
              <button
                className="btn btn-ghost text-2xl px-6 py-4 min-h-[44px] min-w-[44px]"
                onClick={() => void speak(item.audioText ?? item.stem, 'system')}
                aria-label="Play again"
              >
                🔊
              </button>
              <p className="text-sm text-[var(--color-slate-soft)] mt-4 break-words">
                {item.stemEn}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="zh-display text-6xl sm:text-7xl leading-none break-words">
                {item.stem}
              </div>
              {item.audioText && (
                <button
                  className="btn btn-ghost mt-4 text-xs min-h-[44px]"
                  onClick={() => void speak(item.audioText!, 'system')}
                >
                  🔊 hear it
                </button>
              )}
            </div>
          )}

          <div className="mt-5">
            <OptionList>
              {(item.options ?? []).map((o) => {
                const value = o.pinyin ?? o.zh ?? o.en ?? '';
                const isAnswer = result && value === result.answer;
                return (
                  <button
                    key={o.id}
                    disabled={Boolean(result)}
                    onClick={() => answer(value)}
                    className={`btn btn-choice centre whitespace-normal ${
                      result ? (isAnswer ? 'correct' : 'opacity-40') : ''
                    }`}
                  >
                    <span className={o.pinyin ? 'text-lg font-semibold break-words' : 'zh text-base break-words'}>
                      {value}
                    </span>
                  </button>
                );
              })}
            </OptionList>
          </div>

          {result && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 text-sm text-center break-words ${
                result.correct ? 'text-[var(--color-jade-bright)]' : 'text-[var(--color-gold)]'
              }`}
            >
              {result.correct ? '对！' : result.explainEn || `It was ${result.answer}.`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </Screen>
  );
}
