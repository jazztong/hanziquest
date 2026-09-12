'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import HanziText from '@/components/HanziText';
import Recorder from '@/components/Recorder';
import ArtImage from '@/components/ArtImage';
import { useSpeak } from '@/components/Speak';
import PreTeach from '@/components/PreTeach';
import SoundToggle from '@/components/SoundToggle';
import { Centred, PageHeader, Loading, OptionList } from '@/components/ui';
import { sfx } from '@/lib/sfx';
import type { ChapterScript, StoryNode, Line } from '@/lib/story/types';

interface CastMember {
  id: string;
  nameZh: string;
  nameEn: string;
  noteEn: string;
}

interface NextResponse {
  chapter: {
    id: string;
    title: string;
    titleEn: string;
    band: number;
    artId: string | null;
    script: ChapterScript;
  } | null;
  cast: CastMember[];
  support: 'full' | 'pinyin' | 'none';
  gate: {
    decision: 'serve' | 'pre-teach' | 'reject';
    reason: string;
    preTeach: { c: string; count: number; band: number; gloss: string }[];
  };
  reason?: string;
}

export default function ChapterPage() {
  const router = useRouter();
  const [data, setData] = useState<NextResponse | null>(null);
  const [preTeachDone, setPreTeachDone] = useState(false);
  const [nodeId, setNodeId] = useState<string>('');
  const [path, setPath] = useState<string[]>([]);
  const [choiceResult, setChoiceResult] = useState<{ correct: boolean; feedback?: string } | null>(null);
  const [speakResult, setSpeakResult] = useState<{ score: number; note: string } | null>(null);
  const [activeLine, setActiveLine] = useState(0);
  const [activeChar, setActiveChar] = useState(-1);
  const [finished, setFinished] = useState<{ cardsMinted: number; xp: number; levelledUp: boolean } | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const scores = useRef<{ asked: number; right: number; detours: number }>({ asked: 0, right: 0, detours: 0 });
  const { speak, stop } = useSpeak();

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/story/next').catch(() => null);
      const b = (await res?.json().catch(() => null)) as NextResponse | null;
      // A failed or error response has no `gate`, and reading gate.preTeach
      // below would throw. Fall back to the "no chapter" screen, which already
      // explains itself.
      if (!b || (b as unknown as { error?: string }).error || !b.gate) {
        setData({ chapter: null, cast: [], support: 'full', gate: { decision: 'reject', reason: '', preTeach: [] }, reason: 'Could not load a chapter. If you have been signed out, sign in again.' });
        setPreTeachDone(true);
        return;
      }
      setData(b);
      if (b.chapter) setNodeId(b.chapter.script.start);
      if (b.gate?.decision !== 'pre-teach') setPreTeachDone(true);
    })();
    return () => stop();
  }, [stop]);

  const script = data?.chapter?.script;
  const node: StoryNode | undefined = useMemo(
    () => script?.nodes.find((n) => n.id === nodeId),
    [script, nodeId],
  );

  const targets = useMemo(() => script?.targets.map((t) => t.zh) ?? [], [script]);
  const castById = useMemo(
    () => new Map((data?.cast ?? []).map((c) => [c.id, c])),
    [data?.cast],
  );

  // Read the current line aloud and advance the karaoke highlight. Auto-play is
  // on by default because the whole point is hearing it; the toggle exists for
  // a noisy bus.
  const playLine = useCallback(
    (line: Line, onEnd?: () => void) => {
      setActiveChar(-1);
      void speak(line.zh, line.speaker, {
        onBoundary: (i) => setActiveChar(i),
        onEnd: () => {
          setActiveChar(-1);
          onEnd?.();
        },
      });
    },
    [speak],
  );

  useEffect(() => {
    if (!node || !autoPlay || !preTeachDone) return;
    setActiveLine(0);
    const line = node.lines[0];
    if (line) playLine(line);
  }, [node, autoPlay, preTeachDone, playLine]);

  function goTo(next: string) {
    sfx('page');
    stop();
    setChoiceResult(null);
    setSpeakResult(null);
    setActiveLine(0);
    setPath((p) => [...p, next]);
    setNodeId(next);
  }

  async function complete() {
    if (!data?.chapter) return;
    const comprehension = scores.current.asked ? scores.current.right / scores.current.asked : 1;
    const res = await fetch('/api/story/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chapterId: data.chapter.id,
        path,
        comprehensionScore: comprehension,
        detours: scores.current.detours,
      }),
    });
    const b = await res.json();
    sfx(b.xp?.levelledUp ? 'levelUp' : 'complete');
    setFinished({
      cardsMinted: b.cardsMinted ?? 0,
      xp: b.xp?.gained ?? 0,
      levelledUp: b.xp?.levelledUp ?? false,
    });
  }

  if (!data) return <Loading what="Loading the next chapter…" />;

  if (!data.chapter) {
    return (
      <Centred>
        <p className="zh-display text-2xl sm:text-3xl text-[var(--color-gold)] break-words">
          暂时没有新章节
        </p>
        <p className="text-sm text-[var(--color-slate-soft)] mt-3 leading-relaxed break-words">
          {data.reason ?? 'No chapter is available at your level right now.'} Build up the deck for a
          day or two and the next one will unlock — or add an <code className="break-all">ANTHROPIC_API_KEY</code> to
          have new chapters written on demand.
        </p>
        <button className="btn btn-ghost min-h-11 mt-6" onClick={() => router.push('/play')}>
          Back to the map
        </button>
      </Centred>
    );
  }

  if (!preTeachDone && data.gate.preTeach.length > 0) {
    return (
      <PreTeach
        chars={data.gate.preTeach}
        chapterTitle={data.chapter.titleEn}
        onDone={() => setPreTeachDone(true)}
      />
    );
  }

  if (finished) {
    return (
      <Centred>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <p className="pill">Chapter complete</p>
          <h1 className="zh-display text-2xl sm:text-3xl mt-4 text-[var(--color-gold)] break-words">
            {data.chapter.title}
          </h1>
          <p className="text-sm text-[var(--color-slate-soft)] mt-2 break-words">{data.chapter.titleEn}</p>

          <div className="surface p-4 sm:p-5 mt-6 text-left space-y-2.5">
            <Row label="New cards collected" value={`${finished.cardsMinted}`} />
            <Row label="XP earned" value={`+${finished.xp}`} />
            <Row
              label="Clues understood"
              value={
                scores.current.asked
                  ? `${scores.current.right} / ${scores.current.asked}`
                  : '—'
              }
            />
            {scores.current.detours > 0 && (
              <Row label="Detours taken" value={`${scores.current.detours}`} />
            )}
          </div>

          {finished.levelledUp && (
            <p className="mt-4 text-[var(--color-gold)] font-semibold">Level up!</p>
          )}

          <div className="flex flex-wrap gap-2 mt-7">
            <button className="btn btn-ghost flex-1 min-w-0 min-h-11 px-2" onClick={() => router.push('/deck')}>
              See the new cards
            </button>
            <button className="btn btn-primary flex-1 min-w-0 min-h-11 px-2" onClick={() => router.push('/play')}>
              Back to the map
            </button>
          </div>
        </motion.div>
      </Centred>
    );
  }

  if (!node) return null;

  const speakerOf = (line: Line) => castById.get(line.speaker);

  return (
    // Not `Screen`: the scene art is deliberately full-bleed, so the gutter has
    // to start below it. The story column repeats Screen's gutter and safe-area
    // inset instead.
    <main className="min-h-dvh flex flex-col">
      <div className="px-4 pt-3 border-b border-[#222d3d]">
        <PageHeader
          back="/play"
          title={<span className="zh">{data.chapter.title}</span>}
          subtitle={data.chapter.titleEn}
          right={
            <>
              <SoundToggle />
              <button
                className={`btn shrink-0 min-h-11 px-3 text-xs ${autoPlay ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAutoPlay((a) => !a)}
                title="Read each line aloud automatically"
              >
                {autoPlay ? '🔊 auto' : '🔇 auto'}
              </button>
            </>
          }
        />
      </div>

      {/* Scene art. Bottom third stays low-detail by art direction, because the
          dialogue panel sits over it.
          The height is clamped rather than left at a fixed 3:2 ratio: on a short
          screen a 3:2 block ate everything above the fold and left the story
          text with a sliver. It now gives way to the text and never exceeds a
          third of the viewport. */}
      <div
        className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#0e1520]"
        style={{ maxHeight: 'clamp(5rem, 30vh, 20rem)' }}
      >
        <ArtImage
          id={node.artId ?? data.chapter.artId ?? ''}
          fallbackId={data.chapter.artId ?? undefined}
          alt=""
          className="w-full h-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#131a26] to-transparent" />
      </div>

      <div
        className="flex-1 min-h-0 px-4 py-5 max-w-2xl w-full mx-auto pb-28"
        style={{
          paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {node.lines.map((line, i) => {
              const cast = speakerOf(line);
              const isActive = i === activeLine;
              return (
                <div key={line.id}>
                  {cast && (
                    <button
                      className="text-xs text-[var(--color-jade-bright)] inline-flex min-h-11 items-center text-left break-words"
                      title={cast.noteEn}
                    >
                      <span className="zh">{cast.nameZh}</span>{' '}
                      <span className="text-[var(--color-slate)]">{cast.nameEn}</span>
                    </button>
                  )}
                  <p
                    className={`text-lg leading-relaxed break-words ${isActive ? 'line-active' : 'line-idle'}`}
                    onClick={() => {
                      setActiveLine(i);
                      playLine(line);
                    }}
                  >
                    <HanziText
                      text={line.zh}
                      targets={targets}
                      support={data.support}
                      activeIndex={isActive ? activeChar : -1}
                    />
                  </p>
                  {data.support === 'full' && (
                    <p className="text-sm text-[var(--color-slate-soft)] mt-0.5">{line.en}</p>
                  )}
                </div>
              );
            })}

            {/* Node-specific controls */}
            {node.kind === 'narration' && (
              <button
                className="btn btn-primary w-full min-h-11 mt-4"
                onClick={() => (node.next ? goTo(node.next) : complete())}
              >
                Continue
              </button>
            )}

            {node.kind === 'end' && (
              <div className="mt-4">
                <p className="text-sm text-[var(--color-slate-soft)] leading-relaxed mb-4">
                  {node.outro}
                </p>
                <button className="btn btn-primary w-full min-h-11" onClick={complete}>
                  Finish the chapter
                </button>
              </div>
            )}

            {node.kind === 'choice' && (
              <div className="mt-5">
                <p className="zh text-lg mb-1 break-words">
                  <HanziText text={node.promptZh} targets={targets} support={data.support} />
                </p>
                {data.support === 'full' && (
                  <p className="text-sm text-[var(--color-slate-soft)] mb-3 break-words">{node.promptEn}</p>
                )}
                <div className="mt-3">
                 <OptionList>
                  {node.choices.map((c) => (
                    <button
                      key={c.id}
                      disabled={Boolean(choiceResult)}
                      className={`btn btn-choice min-h-11 flex-col items-start ${
                        choiceResult && c.correct ? 'correct' : ''
                      }`}
                      onClick={() => {
                        scores.current.asked += 1;
                        if (c.correct) scores.current.right += 1;
                        else scores.current.detours += 1;
                        sfx(c.correct ? 'correct' : 'wrong');
                        setChoiceResult({ correct: c.correct, feedback: c.feedback });
                        setTimeout(() => goTo(c.to), c.correct ? 1400 : 3200);
                      }}
                    >
                      <span className="zh text-base break-words">{c.zh}</span>
                      {data.support === 'full' && (
                        <span className="block text-xs text-[var(--color-slate-soft)] break-words">
                          {c.en}
                        </span>
                      )}
                    </button>
                  ))}
                 </OptionList>
                </div>
                {choiceResult && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-4 text-sm leading-relaxed ${
                      choiceResult.correct
                        ? 'text-[var(--color-jade-bright)]'
                        : 'text-[var(--color-gold)]'
                    }`}
                  >
                    {choiceResult.feedback}
                  </motion.p>
                )}
              </div>
            )}

            {node.kind === 'detour' && (
              <div className="mt-4">
                <div className="surface p-4 border-[var(--color-gold)]/40">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-gold)] mb-2">
                    Worth a second look
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {node.teaches.map((t) => (
                      <span key={t} className="zh px-2.5 py-1 rounded bg-[#1b2534] border border-[#33415a]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary w-full min-h-11 mt-4" onClick={() => goTo(node.rejoin)}>
                  Got it — carry on
                </button>
              </div>
            )}

            {node.kind === 'speak' && (
              <div className="mt-5 text-center">
                <p className="text-xs uppercase tracking-wider text-[var(--color-jade-bright)] mb-3">
                  {node.framing}
                </p>
                <div className="surface-paper p-4 mb-4">
                  <p className="zh text-xl sm:text-2xl text-[var(--color-ink)] break-words">
                    {node.targetZh}
                  </p>
                  {data.support === 'full' && (
                    <p className="text-sm text-[var(--color-slate)] mt-1 break-words">{node.targetEn}</p>
                  )}
                </div>
                {!speakResult ? (
                  <Recorder
                    targetText={node.targetZh}
                    onResult={async (transcript) => {
                      const res = await fetch('/api/speech/score', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ target: node.targetZh, transcript }),
                      });
                      const b = await res.json();
                      const score = b.score?.overall ?? 0;
                      scores.current.asked += 1;
                      if (score >= node.passScore) scores.current.right += 1;
                      else scores.current.detours += 1;
                      sfx(score >= node.passScore ? 'unlock' : 'wrong');
                      setSpeakResult({
                        score,
                        note:
                          score >= node.passScore
                            ? 'Clear. It works.'
                            : b.score?.toneErrors?.length
                              ? `Close — the tones slipped (${b.score.toneErrors.join(', ')}). It still half-works.`
                              : 'Not quite clear enough. It half-works — carry on.',
                      });
                      setTimeout(
                        () => goTo(score >= node.passScore ? node.onPass : node.onPartial),
                        2600,
                      );
                    }}
                  />
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-3xl font-bold text-[var(--color-jade-bright)]">
                      {Math.round(speakResult.score * 100)}%
                    </p>
                    <p className="text-sm text-[var(--color-slate-soft)] mt-2">{speakResult.note}</p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-slate-soft)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
