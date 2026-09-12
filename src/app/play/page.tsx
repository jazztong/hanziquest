'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ArtImage from '@/components/ArtImage';
import SoundToggle from '@/components/SoundToggle';

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
  nextExam: { label: string; date: string; daysAway: number; isPlaceholder: boolean } | null;
}

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
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div>
          <p className="text-[var(--color-cinnabar)] font-semibold">Could not load your profile.</p>
          <Link href="/login" className="btn btn-primary mt-5">Sign in again</Link>
        </div>
      </main>
    );
  }

  if (!s?.profile) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <p className="text-[var(--color-slate-soft)]">Loading…</p>
      </main>
    );
  }

  const p = s.profile;
  const nextMilestone = s.milestones.filter((m) => !m.achievedAt).sort((a, b) => b.pct - a.pct)[0];

  return (
    <main className="min-h-dvh pb-10">
      {/* Banner */}
      <div className="relative h-40 sm:h-52 overflow-hidden">
        <ArtImage id={`map-${p.genre}`} alt="" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131a26] via-[#131a26]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 max-w-3xl mx-auto flex items-end gap-3">
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
          <SoundToggle className="shrink-0" />
          <Link href="/parent" className="btn btn-ghost px-2.5 py-1 text-xs shrink-0">
            Parent
          </Link>
        </div>
      </div>

      <div className="px-4 max-w-3xl mx-auto">
        <div className="progress mt-4">
          <i style={{ width: `${(p.into / p.need) * 100}%` }} />
        </div>
        <p className="text-[11px] text-[var(--color-slate)] mt-1">
          {p.into} / {p.need} XP to level {p.level + 1}
        </p>

        {/* Today */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <h2 className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)] mb-2">
            Today · about {p.dailyMinutesGoal} min
          </h2>
          <Link href="/play/chapter" className="surface block p-5 hover:border-[var(--color-jade)] transition">
            <div className="flex items-center gap-4">
              <div className="text-3xl" aria-hidden>📖</div>
              <div className="flex-1">
                <div className="font-bold">Continue the story</div>
                <div className="text-sm text-[var(--color-slate-soft)]">
                  {s.chaptersCompleted === 0
                    ? 'Chapter one is waiting.'
                    : `${s.chaptersCompleted} chapter${s.chaptersCompleted === 1 ? '' : 's'} done.`}
                </div>
              </div>
              <span className="text-[var(--color-jade)]" aria-hidden>→</span>
            </div>
          </Link>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <Link href="/deck" className="surface p-4 hover:border-[var(--color-jade)] transition">
              <div className="text-2xl" aria-hidden>🎴</div>
              <div className="font-semibold mt-1.5 text-sm">识字</div>
              <div className="text-xs text-[var(--color-slate-soft)]">
                {s.cards.due > 0 ? `${s.cards.due} due` : 'Clear'}
              </div>
            </Link>
            <Link href="/arcade" className="surface p-4 hover:border-[var(--color-jade)] transition">
              <div className="text-2xl" aria-hidden>🎯</div>
              <div className="font-semibold mt-1.5 text-sm">声调</div>
              <div className="text-xs text-[var(--color-slate-soft)]">Tone arcade</div>
            </Link>
            <Link href="/relics" className="surface p-4 hover:border-[var(--color-jade)] transition">
              <div className="text-2xl" aria-hidden>📜</div>
              <div className="font-semibold mt-1.5 text-sm">古诗文</div>
              <div className="text-xs text-[var(--color-slate-soft)]">
                {s.relics.activated}/{s.relics.total}
              </div>
            </Link>
          </div>
        </motion.section>

        {/* Numbers */}
        <section className="grid grid-cols-3 gap-3 mt-6">
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
              <span className="text-sm font-bold text-[var(--color-jade-bright)] shrink-0">
                {Math.round(nextMilestone.current)} / {nextMilestone.target}
              </span>
            </div>
            <div className="progress mt-2.5">
              <i style={{ width: `${nextMilestone.pct}%` }} />
            </div>
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
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="surface p-3 text-center">
      <div className="text-2xl font-bold text-[var(--color-jade-bright)]">{value}</div>
      <div className="text-[11px] text-[var(--color-paper-dim)] mt-0.5">{label}</div>
      <div className="text-[10px] text-[var(--color-slate)]">{sub}</div>
    </div>
  );
}
