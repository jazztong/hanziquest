'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import HanziText from '@/components/HanziText';
import Recorder from '@/components/Recorder';
import ArtImage from '@/components/ArtImage';
import { useSpeak } from '@/components/Speak';
import PreTeach from '@/components/PreTeach';
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
      const res = await fetch('/api/story/next');
      const b = (await res.json()) as NextResponse;
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
    setFinished({
      cardsMinted: b.cardsMinted ?? 0,
      xp: b.xp?.gained ?? 0,
      levelledUp: b.xp?.levelledUp ?? false,
    });
  }

  if (!data) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <p className="text-[var(--color-slate-soft)]">Loading the next chapter…</p>
      </main>
    );
  }

  if (!data.chapter) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div className="max-w-sm">
          <p className="zh-display text-3xl text-[var(--color-gold)]">暂时没有新章节</p>
          <p className="text-sm text-[var(--color-slate-soft)] mt-3 leading-relaxed">
            {data.reason ?? 'No chapter is available at your level right now.'} Build up the deck for
            a day or two and the next one will unlock — or add an <code>ANTHROPIC_API_KEY</code> to
            have new chapters written on demand.
          </p>
          <button className="btn btn-ghost mt-6" onClick={() => router.push('/play')}>
            Back to the map
          </button>
        </div>
      </main>
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
      <main className="min-h-dvh grid place-items-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <p className="pill">Chapter complete</p>
          <h1 className="zh-display text-3xl mt-4 text-[var(--color-gold)]">{data.chapter.title}</h1>
          <p className="text-sm text-[var(--color-slate-soft)] mt-2">{data.chapter.titleEn}</p>

          <div className="surface p-5 mt-6 text-left space-y-2.5">
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

          <div className="flex gap-2 mt-7">
            <button className="btn btn-ghost flex-1" onClick={() => router.push('/deck')}>
              See the new cards
            </button>
            <button className="btn btn-primary flex-1" onClick={() => router.push('/play')}>
              Back to the map
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!node) return null;

  const speakerOf = (line: Line) => castById.get(line.speaker);

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3 border-b border-[#222d3d]">
        <button className="btn btn-ghost px-2.5 py-1 text-xs" onClick={() => router.push('/play')}>
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="zh text-sm truncate">{data.chapter.title}</div>
          <div className="text-[11px] text-[var(--color-slate)] truncate">{data.chapter.titleEn}</div>
        </div>
        <button
          className={`btn px-2.5 py-1 text-xs ${autoPlay ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setAutoPlay((a) => !a)}
          title="Read each line aloud automatically"
        >
          {autoPlay ? '🔊 auto' : '🔇 auto'}
        </button>
      </header>

      {/* Scene art. Bottom third stays low-detail by art direction, because the
          dialogue panel sits over it. */}
      <div className="relative aspect-[3/2] max-h-[38vh] w-full overflow-hidden bg-[#0e1520]">
        <ArtImage
          id={node.artId ?? data.chapter.artId ?? ''}
          fallbackId={data.chapter.artId ?? undefined}
          alt=""
          className="w-full h-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#131a26] to-transparent" />
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl w-full mx-auto pb-28">
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
                      className="text-xs text-[var(--color-jade-bright)] mb-0.5"
                      title={cast.noteEn}
                    >
                      <span className="zh">{cast.nameZh}</span>{' '}
                      <span className="text-[var(--color-slate)]">{cast.nameEn}</span>
                    </button>
                  )}
                  <p
                    className={`text-lg leading-relaxed ${isActive ? 'line-active' : 'line-idle'}`}
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
                className="btn btn-primary w-full mt-4"
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
                <button className="btn btn-primary w-full" onClick={complete}>
                  Finish the chapter
                </button>
              </div>
            )}

            {node.kind === 'choice' && (
              <div className="mt-5">
                <p className="zh text-lg mb-1">
                  <HanziText text={node.promptZh} targets={targets} support={data.support} />
                </p>
                {data.support === 'full' && (
                  <p className="text-sm text-[var(--color-slate-soft)] mb-3">{node.promptEn}</p>
                )}
                <div className="grid gap-2 mt-3">
                  {node.choices.map((c) => (
                    <button
                      key={c.id}
                      disabled={Boolean(choiceResult)}
                      className={`btn btn-choice ${
                        choiceResult && c.correct ? 'correct' : ''
                      }`}
                      onClick={() => {
                        scores.current.asked += 1;
                        if (c.correct) scores.current.right += 1;
                        else scores.current.detours += 1;
                        setChoiceResult({ correct: c.correct, feedback: c.feedback });
                        setTimeout(() => goTo(c.to), c.correct ? 1400 : 3200);
                      }}
                    >
                      <span className="zh text-base">{c.zh}</span>
                      {data.support === 'full' && (
                        <span className="block text-xs text-[var(--color-slate-soft)] mt-1">
                          {c.en}
                        </span>
                      )}
                    </button>
                  ))}
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
                <button className="btn btn-primary w-full mt-4" onClick={() => goTo(node.rejoin)}>
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
                  <p className="zh text-2xl text-[var(--color-ink)]">{node.targetZh}</p>
                  {data.support === 'full' && (
                    <p className="text-sm text-[var(--color-slate)] mt-1">{node.targetEn}</p>
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
