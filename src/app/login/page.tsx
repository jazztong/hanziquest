'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELD =
  'mt-1.5 w-full rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2.5 min-h-11 text-[var(--color-paper)] outline-none focus:border-[var(--color-jade)]';
const LABEL = 'text-xs uppercase tracking-wider text-[var(--color-slate-soft)]';

/**
 * Sign in, or make a new player.
 *
 * One screen for both, because a family arriving for the first time and a
 * player coming back are the same person a week apart, and a separate /signup
 * route is one more thing to find. The mode is a toggle rather than a route so
 * a mistyped password does not lose what was typed.
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'new'>('in');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [wantParent, setWantParent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const joining = mode === 'new';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const res = await fetch(joining ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(
        joining
          ? {
              name,
              password,
              ...(wantParent && parentName ? { parentName, parentPassword } : null),
            }
          : { name, password },
      ),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? (joining ? 'Could not create that account.' : 'Could not sign in.'));
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
            <span className={LABEL}>{joining ? 'Choose a name' : 'Who is playing?'}</span>
            <input
              autoFocus
              autoCapitalize="none"
              autoComplete={joining ? 'off' : 'username'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FIELD}
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className={LABEL}>Password</span>
            <input
              type="password"
              autoComplete={joining ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD}
            />
            {joining && (
              <span className="block mt-1 text-[11px] text-[var(--color-slate)]">
                At least 8 characters. There is no way to reset it — write it down.
              </span>
            )}
          </label>

          {joining && (
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantParent}
                  onChange={(e) => setWantParent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0"
                />
                <span className="text-xs text-[var(--color-slate-soft)] leading-relaxed">
                  Also make a parent account, so someone can see progress and upload the weekly
                  课文.
                </span>
              </label>

              {wantParent && (
                <div className="mt-3 space-y-3 pl-6">
                  <label className="block">
                    <span className={LABEL}>Parent name</span>
                    <input
                      autoCapitalize="none"
                      autoComplete="off"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className={FIELD}
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>Parent password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      className={FIELD}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-cinnabar)]" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary w-full" disabled={busy || !name || !password}>
            {busy ? (joining ? 'Creating…' : 'Checking…') : joining ? 'Start playing' : 'Enter'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(joining ? 'in' : 'new');
              setError('');
            }}
            className="w-full text-xs text-[var(--color-slate-soft)] underline underline-offset-4 min-h-11"
          >
            {joining ? 'I already have an account' : 'New here? Make an account'}
          </button>
        </form>

        {/* Deliberately says nothing about which accounts exist.
            It used to name both and explain where their passwords came from,
            which was fine on a laptop and is not fine on a public address:
            it hands a stranger half of every credential pair. */}
        <p className="mt-6 text-xs text-center text-[var(--color-slate-soft)] leading-relaxed">
          Every player keeps their own characters, deck and score. Private. No analytics, no
          third-party tracking.
        </p>
      </div>
    </main>
  );
}
