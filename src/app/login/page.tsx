'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? 'Could not sign in.');
      return;
    }
    router.push(body.user.role === 'parent' ? '/parent' : '/');
    router.refresh();
  }

  return (
    <main className="min-h-dvh grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="zh-display text-5xl text-[var(--color-gold)] tracking-widest">
            汉字任务
          </div>
          <div className="mt-2 text-sm text-[var(--color-slate-soft)] tracking-[0.3em] uppercase">
            HanziQuest
          </div>
        </div>

        <form onSubmit={submit} className="surface p-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)]">
              Who is playing?
            </span>
            <input
              autoFocus
              autoCapitalize="none"
              autoComplete="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2.5 text-[var(--color-paper)] outline-none focus:border-[var(--color-jade)]"
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-slate-soft)]">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2.5 text-[var(--color-paper)] outline-none focus:border-[var(--color-jade)]"
            />
          </label>

          {error && (
            <p className="text-sm text-[var(--color-cinnabar)]" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary w-full" disabled={busy || !name || !password}>
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </form>

        {/* Deliberately says nothing about which accounts exist.
            It used to name both and explain where their passwords came from,
            which was fine on a laptop and is not fine on a public address:
            it hands a stranger half of every credential pair. Whoever should
            be logging in already knows the name they were given. */}
        <p className="mt-6 text-xs text-center text-[var(--color-slate-soft)] leading-relaxed">
          Private. No analytics, no third-party tracking.
        </p>
      </div>
    </main>
  );
}
