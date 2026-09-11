'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GENRES, AVATARS } from '@/content/genres';
import ArtImage from '@/components/ArtImage';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [genre, setGenre] = useState<string>('');
  const [avatarId, setAvatarId] = useState<string>('');
  const [heroName, setHeroName] = useState('');
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    const res = await fetch('/api/profile/onboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ genre, avatarId, heroName }),
    });
    if (res.ok) {
      router.push('/prologue');
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh px-5 py-8 max-w-3xl mx-auto">
      <Steps step={step} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <Panel key="genre" title="Pick your story" sub="You can change this later without losing anything.">
            <div className="grid gap-3 sm:grid-cols-2">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setGenre(g.id);
                    setStep(1);
                  }}
                  className={`surface text-left p-4 transition hover:border-[var(--color-jade)] ${
                    genre === g.id ? 'border-[var(--color-jade)]' : ''
                  }`}
                >
                  <div className="aspect-[3/2] mb-3 overflow-hidden rounded-lg bg-[#111925]">
                    <ArtImage id={g.mapArtId} alt="" className="w-full h-full" />
                  </div>
                  <div className="zh-display text-2xl text-[var(--color-gold)]">{g.nameZh}</div>
                  <div className="text-sm font-semibold mt-0.5">{g.nameEn}</div>
                  <div className="text-xs text-[var(--color-jade-bright)] mt-1.5">{g.tagline}</div>
                  <p className="text-sm text-[var(--color-slate-soft)] mt-2 leading-relaxed">{g.hook}</p>
                </button>
              ))}
            </div>
          </Panel>
        )}

        {step === 1 && (
          <Panel key="avatar" title="Pick who you are" sub="Your face never shows up in scenes — you are looking out of them.">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAvatarId(a.id);
                    setStep(2);
                  }}
                  className={`surface p-2 transition hover:border-[var(--color-jade)] ${
                    avatarId === a.id ? 'border-[var(--color-jade)]' : ''
                  }`}
                >
                  <div className="aspect-square overflow-hidden rounded-md bg-[#111925]">
                    <ArtImage id={a.artId} alt={a.nameEn} className="w-full h-full" />
                  </div>
                  <div className="text-[11px] mt-1.5 text-[var(--color-slate-soft)] leading-tight">
                    {a.nameEn}
                  </div>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost mt-5" onClick={() => setStep(0)}>
              ← Back
            </button>
          </Panel>
        )}

        {step === 2 && (
          <Panel key="name" title="What should the story call you?" sub="Any name. It is used in the story, nowhere else.">
            <input
              autoFocus
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              maxLength={24}
              placeholder="the student"
              className="w-full rounded-lg bg-[#111925] border border-[#2f3d52] px-4 py-3 text-xl outline-none focus:border-[var(--color-jade)]"
            />
            <div className="mt-6 surface p-4 text-sm text-[var(--color-slate-soft)] leading-relaxed">
              <p className="text-[var(--color-paper)] font-semibold mb-1.5">What happens next</p>
              The first chapter is a bit different from the rest: it works out what you already know,
              so every chapter after it is pitched at you rather than at nobody in particular. It
              takes about 40 minutes and you can stop halfway and come back — nothing is lost.
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={!heroName.trim() || busy}
                onClick={finish}
              >
                {busy ? 'Starting…' : 'Begin the prologue'}
              </button>
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </main>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ['Story', 'Character', 'Name'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2 flex-1">
          <div
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? 'bg-[var(--color-jade)]' : 'bg-[#2a3648]'
            }`}
          />
          <span
            className={`text-[11px] uppercase tracking-wider ${
              i <= step ? 'text-[var(--color-jade-bright)]' : 'text-[var(--color-slate)]'
            }`}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-[var(--color-slate-soft)] mt-1 mb-5">{sub}</p>
      {children}
    </motion.section>
  );
}
