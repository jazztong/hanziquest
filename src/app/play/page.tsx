'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ArtImage from '@/components/ArtImage';
import SoundToggle from '@/components/SoundToggle';
import { Screen, Centred, Loading, Stat, Progress } from '@/components/ui';

interface Summary {
  profile: {
    heroName: string;
    genre: string;
    genreName: string;
    genreNameEn: string;
    avatarId: string;
    xp: number;
    level: number;
    into: number;
    need: number;
    streakDays: number;
    storyBand: number;
    dailyMinutesGoal: number;
  } | null;
  skills: { skill: string; percentOfTarget: number; hskLevel: number }[];
  knownChars: number;
  cards: { due: number; total: number };
  relics: { total: number; activated: number; started: number };
  chaptersCompleted: number;
  reviewsThisWeek: number;
  milestones: { id: string; title: string; titleEn: string; current: number; target: number; pct: number; achievedAt: number | null }[];
  lessons: { id: string; title: string; bookRef: string; weekOf: string | null }[];
  nextExam: { label: string; date: string; daysAway: number; isPlaceholder: boolean } | null;
}

/**
 * The banner is full-bleed while the rest of the hub sits inside `Screen`'s
 * gutter, so it cancels that gutter (and the safe-area inset) with a matching
 * negative margin rather than the page opting out of the shared frame.
 */
const BLEED: React.CSSProperties = {
  marginLeft: 'calc(-1 * max(1rem, env(safe-area-inset-left)))',
  marginRight: 'calc(-1 * max(1rem, env(safe-area-inset-right)))',
};

export default function PlayHub() {
  const [s, setS] = useState<Summary | null>(null);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/player/summary')
      .then((r) => r.json())
      .then((b) => (b?.error ? setFailed(true) : setS(b)))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <Centred>
        <p className="text-[var(--color-cinnabar)] font-semibold">Could not load your profile.</p>
        <Link href="/login" className="btn btn-primary mt-5">Sign in again</Link>
      </Centred>
    );
  }

  if (!s?.profile) return <Loading />;

  const p = s.profile;
  const nextMilestone = s.milestones.filter((m) => !m.achievedAt).sort((a, b) => b.pct - a.pct)[0];
  // Most recent by the week it is taught, falling back to upload order.
  const latestLesson = [...(s.lessons ?? [])].sort((a, b) =>
    (b.weekOf ?? '').localeCompare(a.weekOf ?? ''),
  )[0];

  return (
    <Screen width="wide">
      {/* Banner */}
      <div className="relative h-40 sm:h-52 overflow-hidden -mt-4" style={BLEED}>
        <ArtImage id={`map-${p.genre}`} alt="" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131a26] via-[#131a26]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end gap-2 sm:gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#33415a] shrink-0 bg-[#111925]">
            <ArtImage id={p.avatarId} alt="" className="w-full h-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold truncate">{p.heroName}</div>
            <div className="text-xs text-[var(--color-slate-soft)] truncate">
              <span className="zh">{p.genreName}</span> · Level {p.level}
              {p.streakDays > 0 && ` · ${p.streakDays}-day streak`}
            </div>
          </div>
          <SoundToggle className="shrink-0 min-w-[44px] min-h-[44px]" />
          <Link href="/parent" className="btn btn-ghost shrink-0 px-3 text-xs min-h-[44px]">
            Parent
          </Link>
        </div>
      </div>

      <Progress value={p.into} max={p.need} className="mt-4" />
      <p className="text-[11px] text-[var(--color-slate)] mt-1">
        {p.into} / {p.need} XP to level {p.level + 1}
      </p>

      {/* Today */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <h2 className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)] mb-2">
          Today · about {p.dailyMinutesGoal} min
        </h2>
        <Link
          href="/play/chapter"
          className="surface block p-4 sm:p-5 hover:border-[var(--color-jade)] transition"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-3xl shrink-0" aria-hidden>📖</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold">Continue the story</div>
              <div className="text-sm text-[var(--color-slate-soft)] break-words">
                {s.chaptersCompleted === 0
                  ? 'Chapter one is waiting.'
                  : `${s.chaptersCompleted} chapter${s.chaptersCompleted === 1 ? '' : 's'} done.`}
              </div>
            </div>
            <span className="text-[var(--color-jade)] shrink-0" aria-hidden>→</span>
          </div>
        </Link>

        {latestLesson && (
          <Link
            href={`/lesson/${latestLesson.id}`}
            className="surface block p-4 sm:p-5 mt-3 hover:border-[var(--color-jade)] transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-3xl shrink-0" aria-hidden>📚</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">This week&apos;s 课文</div>
                <div className="zh text-sm text-[var(--color-slate-soft)] truncate">
                  {latestLesson.title}
                  {latestLesson.bookRef ? ` · ${latestLesson.bookRef}` : ''}
                </div>
              </div>
              <span className="text-[var(--color-jade)] shrink-0" aria-hidden>→</span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
          <Link
            href="/deck"
            className="surface p-3 sm:p-4 min-w-0 hover:border-[var(--color-jade)] transition"
          >
            <div className="text-2xl" aria-hidden>🎴</div>
            <div className="font-semibold mt-1.5 text-sm">识字</div>
            <div className="text-xs text-[var(--color-slate-soft)] break-words">
              {s.cards.due > 0 ? `${s.cards.due} due` : 'Clear'}
            </div>
          </Link>
          <Link
            href="/arcade"
            className="surface p-3 sm:p-4 min-w-0 hover:border-[var(--color-jade)] transition"
          >
            <div className="text-2xl" aria-hidden>🎯</div>
            <div className="font-semibold mt-1.5 text-sm">声调</div>
            <div className="text-xs text-[var(--color-slate-soft)] break-words">Tone arcade</div>
          </Link>
          <Link
            href="/relics"
            className="surface p-3 sm:p-4 min-w-0 hover:border-[var(--color-jade)] transition"
          >
            <div className="text-2xl" aria-hidden>📜</div>
            <div className="font-semibold mt-1.5 text-sm">古诗文</div>
            <div className="text-xs text-[var(--color-slate-soft)] break-words">
              {s.relics.activated}/{s.relics.total}
            </div>
          </Link>
        </div>
      </motion.section>

      {/* Numbers */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">
        <Stat label="Characters" value={s.knownChars} sub="read on sight" />
        <Stat label="Cards" value={s.cards.total} sub="collected" />
        <Stat label="Reviews" value={s.reviewsThisWeek} sub="this week" />
      </section>

      {/* Next milestone */}
      {nextMilestone && (
        <section className="surface p-4 mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="zh text-sm truncate">{nextMilestone.title}</div>
              <div className="text-xs text-[var(--color-slate-soft)] truncate">
                {nextMilestone.titleEn}
              </div>
            </div>
            <span className="text-sm font-bold text-[var(--color-jade-bright)] shrink-0 tabular-nums">
              {Math.round(nextMilestone.current)} / {nextMilestone.target}
            </span>
          </div>
          <Progress value={nextMilestone.pct} className="mt-2.5" />
        </section>
      )}

      {/* Next exam */}
      {s.nextExam && (
        <section className="mt-4 text-center">
          <p className="text-xs text-[var(--color-slate-soft)]">
            <span className="zh">{s.nextExam.label}</span> in{' '}
            <b className="text-[var(--color-gold)]">{s.nextExam.daysAway} days</b>
            {s.nextExam.isPlaceholder && (
              <span className="text-[var(--color-slate)]"> · date not confirmed</span>
            )}
          </p>
        </section>
      )}
    </Screen>
  );
}
