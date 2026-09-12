'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Dash {
  profile: { heroName: string; level: number; xp: number; streakDays: number; storyBand: number } | null;
  skills: { skill: string; hskLevel: number; percentOfTarget: number; lastAccuracy: number }[];
  knownChars: number;
  cards: { total: number; mature: number };
  milestones: { id: string; title: string; titleEn: string; current: number; target: number; dueDate: string | null; achievedAt: number | null }[];
  exams: { id: string; label: string; kind: string; date: string; isPlaceholder: boolean }[];
  lessons: { id: string; title: string; bookRef: string; weekOf: string | null; vocab: string[] }[];
  weakAreas: { tag: string; skill: string; n: number }[];
  recordings: { id: string; kind: string; path: string; targetText: string; createdAt: number }[];
  reviewsByDay: { day: string; n: number }[];
  attemptsThisWeek: number;
  accuracyThisWeek: number | null;
  chapters: { id: string; title: string; titleEn: string; genre: string; band: number; source: string; flagged: boolean; completed: boolean }[];
  itemCount: number;
  pendingArt: { id: string; type: string; status: string; error?: string }[];
  providers: { claude: boolean; azure: boolean };
}

const SKILL_LABEL: Record<string, string> = {
  recognition: '识字',
  pinyinTone: '拼音声调',
  vocabulary: '词语',
  readAloud: '朗读',
  comprehension: '阅读理解',
  handwriting: '书写',
  languageKnowledge: '语文基础',
  writing: '写作',
};

export default function ParentDashboard() {
  const router = useRouter();
  const [d, setD] = useState<Dash | null>(null);
  const [tab, setTab] = useState<'overview' | 'exams' | 'lessons' | 'content'>('overview');

  const load = () =>
    fetch('/api/parent/dashboard')
      .then((r) => r.json())
      .then((b) => (b.error ? router.push('/login') : setD(b)));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!d) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <p className="text-[var(--color-slate-soft)]">Loading…</p>
      </main>
    );
  }

  const placeholders = d.exams.filter((e) => e.isPlaceholder).length;

  return (
    <main className="min-h-dvh px-4 py-6 max-w-4xl mx-auto pb-20">
      <header className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Parent dashboard</h1>
          <p className="text-sm text-[var(--color-slate-soft)] mt-1">
            {d.profile?.heroName || 'Student'} · Level {d.profile?.level ?? 1}
            {d.profile?.streakDays ? ` · ${d.profile.streakDays}-day streak` : ''}
          </p>
        </div>
        <button
          className="btn btn-ghost text-xs"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }}
        >
          Sign out
        </button>
      </header>

      {placeholders > 0 && (
        <div className="surface p-4 mb-5 border-[var(--color-gold)]/50">
          <p className="text-sm">
            <b className="text-[var(--color-gold)]">{placeholders} exam dates are still guesses.</b>{' '}
            Every milestone is scheduled backwards from them — confirm the real dates in the Exams
            tab and the whole plan re-times itself.
          </p>
        </div>
      )}

      <nav className="flex gap-1.5 mb-6 overflow-x-auto">
        {(['overview', 'exams', 'lessons', 'content'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn px-3 py-1.5 text-xs capitalize ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat label="Characters known" value={d.knownChars} sub="of 2,500 at 初一" />
            <Stat label="Cards" value={d.cards.total} sub={`${d.cards.mature} mature`} />
            <Stat label="Answers this week" value={d.attemptsThisWeek} sub="all mechanics" />
            <Stat
              label="Accuracy"
              value={d.accuracyThisWeek === null ? '—' : `${Math.round(d.accuracyThisWeek * 100)}%`}
              sub="last 7 days"
            />
          </section>

          <Section title="Activity" sub="Reviews per day, last 30 days">
            <ReviewChart data={d.reviewsByDay} />
          </Section>

          <Section title="Skill levels" sub="Measured by the prologue and every rank-up trial since">
            <div className="space-y-2">
              {d.skills.length === 0 && (
                <p className="text-sm text-[var(--color-slate-soft)]">
                  Not measured yet — the prologue has not been completed.
                </p>
              )}
              {d.skills.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <span className="zh text-sm w-24 shrink-0">{SKILL_LABEL[s.skill] ?? s.skill}</span>
                  <div className="progress flex-1">
                    <i style={{ width: `${Math.min(100, s.percentOfTarget)}%` }} />
                  </div>
                  <span className="text-xs text-[var(--color-slate-soft)] w-28 text-right shrink-0">
                    HSK {s.hskLevel} · {Math.round(s.percentOfTarget)}%
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Weak areas" sub="Most-missed tags over 30 days">
            {d.weakAreas.length === 0 ? (
              <p className="text-sm text-[var(--color-slate-soft)]">Nothing logged yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {d.weakAreas.slice(0, 14).map((w) => (
                  <span key={w.tag} className="pill">
                    <span className="zh normal-case">{w.tag.replace(/^standard:/, '')}</span>
                    <b className="text-[var(--color-cinnabar)]">{w.n}</b>
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Milestones">
            <div className="space-y-2.5">
              {d.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="zh text-sm truncate">
                      {m.title}
                      {m.achievedAt && <span className="text-[var(--color-jade)] ml-2">✓</span>}
                    </div>
                    <div className="text-[11px] text-[var(--color-slate)] truncate">
                      {m.titleEn}
                      {m.dueDate && ` · by ${m.dueDate}`}
                    </div>
                    <div className="progress mt-1">
                      <i style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-slate-soft)] shrink-0">
                    {Math.round(m.current)}/{m.target}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Recordings" sub="His own voice. Stored on this machine only.">
            {d.recordings.length === 0 ? (
              <p className="text-sm text-[var(--color-slate-soft)]">
                No recordings saved yet. Read-aloud attempts appear here once he plays a chapter with
                a spoken line.
              </p>
            ) : (
              <ul className="space-y-2">
                {d.recordings.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <audio controls src={`/api/recordings/${r.id}`} className="h-8 flex-1" />
                    <span className="zh text-xs text-[var(--color-slate-soft)] truncate max-w-[40%]">
                      {r.targetText}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Providers" sub="What is switched on right now">
            <ul className="text-sm space-y-1.5">
              <li>
                <Dot on={d.providers.claude} /> Claude API —{' '}
                {d.providers.claude
                  ? 'on: new chapters, real 作文 marking, OCR of uploaded lessons.'
                  : 'off: seed chapters only, 作文 marked on mechanics and length only.'}
              </li>
              <li>
                <Dot on={d.providers.azure} /> Azure Speech —{' '}
                {d.providers.azure
                  ? 'on: neural voices, phoneme-level pronunciation scoring.'
                  : 'off: browser voices, pronunciation scored by transcript match.'}
              </li>
            </ul>
          </Section>
        </>
      )}

      {tab === 'exams' && <Exams exams={d.exams} onChange={load} />}

      {tab === 'lessons' && <Lessons lessons={d.lessons} onChange={load} />}

      {tab === 'content' && (
        <>
          <Section title="Chapters" sub="Everything he can be served, with its source">
            <ul className="space-y-2">
              {d.chapters.map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 min-w-0">
                    <span className="zh truncate block">{c.title}</span>
                    <span className="text-[11px] text-[var(--color-slate)]">
                      {c.titleEn} · {c.genre} · band {c.band} · {c.source}
                      {c.completed && ' · completed'}
                    </span>
                  </span>
                  {c.flagged && <span className="pill text-[var(--color-cinnabar)]">flagged</span>}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Item bank">
            <p className="text-sm text-[var(--color-slate-soft)]">
              {d.itemCount} stored items. Character, pinyin and vocabulary items are generated from
              the HSK dictionary at run time and are not stored — they are correct by construction
              rather than by review.
            </p>
          </Section>

          <Section title="Pending art" sub="Run npm run gen-art to fill these in">
            {d.pendingArt.length === 0 ? (
              <p className="text-sm text-[var(--color-jade-bright)]">
                All manifest entries are generated.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {d.pendingArt.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="pill">{a.status}</span>
                    <span className="text-[var(--color-paper-dim)]">{a.id}</span>
                    <span className="text-[11px] text-[var(--color-slate)]">{a.type}</span>
                    {a.error && <span className="text-[11px] text-[var(--color-cinnabar)]">{a.error}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </main>
  );
}

function Exams({ exams, onChange }: { exams: Dash['exams']; onChange: () => void }) {
  const [busy, setBusy] = useState('');

  async function save(id: string, date: string, label: string) {
    setBusy(id);
    await fetch('/api/parent/exam', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, date, label }),
    });
    setBusy('');
    onChange();
  }

  return (
    <Section title="Exam dates" sub="Milestones are scheduled backwards from these.">
      <ul className="space-y-3">
        {exams
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2">
              <input
                defaultValue={e.label}
                onBlur={(ev) => save(e.id, e.date, ev.target.value)}
                className="zh flex-1 min-w-[10rem] rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2 text-sm outline-none focus:border-[var(--color-jade)]"
              />
              <input
                type="date"
                defaultValue={e.date}
                onChange={(ev) => save(e.id, ev.target.value, e.label)}
                className="rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2 text-sm outline-none focus:border-[var(--color-jade)]"
              />
              {e.isPlaceholder && <span className="pill text-[var(--color-gold)]">guess</span>}
              {busy === e.id && <span className="text-xs text-[var(--color-slate)]">saving…</span>}
            </li>
          ))}
      </ul>
      <p className="text-xs text-[var(--color-slate)] mt-4 leading-relaxed">
        The 2026 初中统考 华文 paper was sat on 22 October 2026 (published timetable). The 2028 date
        here is projected from that pattern — replace it when 董总 publishes.
      </p>
    </Section>
  );
}

function Lessons({ lessons, onChange }: { lessons: Dash['lessons']; onChange: () => void }) {
  const [title, setTitle] = useState('');
  const [bookRef, setBookRef] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ vocab: { w: string; pinyin: string; gloss: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [ocrNote, setOcrNote] = useState('');

  /**
   * Photograph the page instead of typing it.
   *
   * The transcription lands in the same textarea rather than saving straight
   * through, on purpose: OCR of printed Chinese is good but not perfect, and a
   * mis-read character in a 课文 becomes a mis-taught character everywhere
   * downstream. You get to read it before it counts.
   */
  async function readPhotos(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    setOcrNote('');
    try {
      const images = await Promise.all(
        [...files].slice(0, 6).map(
          (f) =>
            new Promise<{ mediaType: string; base64: string }>((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () =>
                resolve({
                  mediaType: f.type || 'image/jpeg',
                  base64: String(fr.result).split(',')[1] ?? '',
                });
              fr.onerror = () => reject(new Error('could not read the file'));
              fr.readAsDataURL(f);
            }),
        ),
      );
      const res = await fetch('/api/lesson/ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ images, hint: bookRef }),
      });
      const b = await res.json();
      if (b.error) {
        setOcrNote(b.error);
      } else {
        setText(b.text);
        if (b.title && !title) setTitle(b.title);
        if (b.bookRef && !bookRef) setBookRef(b.bookRef);
        setOcrNote(
          `Read ${b.chars} characters.` +
            (b.unclear ? ` ${b.unclear} character(s) were unclear and marked 〓 — please fix those.` : '') +
            ' Check it against the page before you add it.',
        );
      }
    } catch {
      setOcrNote('Could not read those images.');
    }
    setReading(false);
  }

  async function upload() {
    setBusy(true);
    const res = await fetch('/api/parent/lesson', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, bookRef, text, weekOf: new Date().toISOString().slice(0, 10) }),
    });
    const b = await res.json();
    setBusy(false);
    if (!b.error) {
      setResult(b);
      setText('');
      setTitle('');
      onChange();
    }
  }

  return (
    <>
      <Section
        title="Upload this week's 课文"
        sub="Photograph the page from your own book, or paste the text. It stays on this machine and is never sent anywhere except to transcribe a photo."
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="课文标题"
              className="zh flex-1 rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2 text-sm outline-none focus:border-[var(--color-jade)]"
            />
            <input
              value={bookRef}
              onChange={(e) => setBookRef(e.target.value)}
              placeholder="初一上册 第六课"
              className="zh flex-1 rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2 text-sm outline-none focus:border-[var(--color-jade)]"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="btn btn-ghost cursor-pointer text-sm">
              📷 {reading ? 'Reading…' : 'Photograph the page'}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={reading}
                onChange={(e) => readPhotos(e.target.files)}
              />
            </label>
            <span className="text-[11px] text-[var(--color-slate)]">
              Up to 6 pages. Needs an ANTHROPIC_API_KEY; otherwise just paste below.
            </span>
          </div>
          {ocrNote && (
            <p className="text-xs text-[var(--color-gold)] leading-relaxed">{ocrNote}</p>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="把课文内容贴在这里，或者用上面的相机拍下课本那一页……"
            className="zh w-full rounded-lg bg-[#111925] border border-[#2f3d52] px-3 py-2 text-sm outline-none focus:border-[var(--color-jade)]"
          />
          <button className="btn btn-primary" disabled={busy || !text.trim()} onClick={upload}>
            {busy ? 'Reading…' : 'Add lesson'}
          </button>
        </div>

        {result && (
          <div className="mt-4">
            <p className="text-sm text-[var(--color-jade-bright)] mb-2">
              Found {result.vocab.length} words above his level:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.vocab.slice(0, 30).map((v) => (
                <span key={v.w} className="pill" title={v.gloss}>
                  <span className="zh normal-case">{v.w}</span>
                  <span className="normal-case text-[var(--color-jade)]">{v.pinyin}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Uploaded lessons">
        {lessons.length === 0 ? (
          <p className="text-sm text-[var(--color-slate-soft)]">Nothing uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((l) => (
              <li key={l.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 min-w-0">
                  <span className="zh block truncate">{l.title}</span>
                  <span className="text-[11px] text-[var(--color-slate)]">
                    {l.bookRef} {l.weekOf && `· ${l.weekOf}`} · {(l.vocab ?? []).length} words
                  </span>
                </span>
                <a href={`/lesson/${l.id}`} className="btn btn-ghost px-2 py-1 text-xs">
                  Preview quest
                </a>
                <button
                  className="btn btn-ghost px-2 py-1 text-xs"
                  onClick={async () => {
                    await fetch(`/api/parent/lesson?id=${l.id}`, { method: 'DELETE' });
                    onChange();
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function ReviewChart({ data }: { data: { day: string; n: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--color-slate-soft)]">No reviews recorded yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.n), 1);
  return (
    <div className="flex items-end gap-1 h-24" role="img" aria-label="Reviews per day">
      {data.map((d) => (
        <div
          key={d.day}
          className="flex-1 rounded-t bg-[var(--color-jade)] min-w-[3px]"
          style={{ height: `${(d.n / max) * 100}%` }}
          title={`${d.day}: ${d.n}`}
        />
      ))}
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5 mb-4">
      <h2 className="font-bold">{title}</h2>
      {sub && <p className="text-xs text-[var(--color-slate-soft)] mt-0.5 mb-3">{sub}</p>}
      <div className={sub ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="surface p-4">
      <div className="text-2xl font-bold text-[var(--color-jade-bright)]">{value}</div>
      <div className="text-xs text-[var(--color-paper-dim)] mt-0.5">{label}</div>
      <div className="text-[10px] text-[var(--color-slate)]">{sub}</div>
    </div>
  );
}

function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block w-2 h-2 rounded-full mr-1.5"
      style={{ background: on ? 'var(--color-jade)' : 'var(--color-slate)' }}
    />
  );
}
