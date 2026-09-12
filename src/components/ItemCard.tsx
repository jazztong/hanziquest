'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HanziText from './HanziText';
import HanziPad from './HanziPad';
import Recorder from './Recorder';
import Speak, { useSpeak } from './Speak';
import type { PublicItem } from '@/lib/items/public';
import { sfx } from '@/lib/sfx';
import RevealCard, { type Reveal } from './RevealCard';

export interface Feedback {
  correct: boolean | null;
  score: number;
  en: string;
  zh?: string;
  detail?: unknown;
  /** The reading, shown the moment the answer is committed. */
  reveal?: Reveal | null;
}

/**
 * Renders any item type and collects one answer.
 *
 * All item types share one component on purpose: the baseline, daily drills,
 * 课文 side quests and boss battles all serve from the same item bank, and
 * giving each surface its own renderer is how they drift apart.
 */
export default function ItemCard({
  item,
  feedback,
  onAnswer,
  busy,
}: {
  item: PublicItem;
  feedback: Feedback | null;
  onAnswer: (value: string, extra?: { audio?: Blob | null }) => void;
  busy?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [hintShown, setHintShown] = useState(false);
  const startedAt = useRef(Date.now());
  const { speak } = useSpeak();

  // Reset per item, and auto-play listening items: for a listening question the
  // audio IS the stem, so making the player press play first is pure friction.
  useEffect(() => {
    setSelected(null);
    setText('');
    setHintShown(false);
    startedAt.current = Date.now();
    const listening = item.type === 'listen-char' || item.type === 'word-listen' || item.type === 'tone-discriminate';
    if (listening && item.audioText) {
      const t = setTimeout(() => void speak(item.audioText!, 'system'), 250);
      return () => clearTimeout(t);
    }
  }, [item.id, item.type, item.audioText, speak]);

  // The verdict sound fires on the feedback arriving, not on the tap, so it
  // reports the actual result rather than the act of answering.
  useEffect(() => {
    if (!feedback) return;
    if (feedback.correct === true) sfx('correct');
    else if (feedback.correct === false) sfx('wrong');
    else sfx('reveal');
  }, [feedback]);

  const locked = Boolean(feedback) || busy;
  const listening = item.type === 'listen-char' || item.type === 'word-listen' || item.type === 'tone-discriminate';

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="surface p-5 sm:p-6"
    >
      {item.passage && (
        <div className="surface-paper p-4 mb-5 max-h-72 overflow-y-auto">
          {item.passageTitle && (
            <h3 className="zh-display text-lg mb-2 text-[var(--color-ink)]">{item.passageTitle}</h3>
          )}
          <div className="zh text-[15px] text-[var(--color-ink-soft)] whitespace-pre-line">
            <HanziText text={item.passage} support="full" />
          </div>
        </div>
      )}

      {/* Stem */}
      {listening ? (
        <div className="text-center py-6">
          <Speak text={item.audioText ?? item.stem} speaker="system" label="Play again" />
          <p className="zh mt-4 text-[var(--color-slate-soft)]">{item.stem}</p>
        </div>
      ) : item.type === 'char-recognise' || item.type === 'char-pinyin' ? (
        <div className="text-center py-4">
          <div className="zh-display text-7xl sm:text-8xl leading-none">{item.stem}</div>
          {item.audioText && (
            <div className="mt-4">
              <Speak text={item.audioText} speaker="system" label="Hear it" />
            </div>
          )}
        </div>
      ) : item.type === 'handwrite' ? null : item.type === 'read-aloud' ? (
        <div className="text-center py-2">
          <div className="zh text-3xl leading-relaxed">
            <HanziText text={item.stem} support="full" />
          </div>
          <div className="mt-3">
            <Speak text={item.stem} speaker="narrator" label="Hear it first" />
          </div>
        </div>
      ) : (
        <div className="zh text-xl leading-relaxed">
          <HanziText text={item.stem} support="full" />
        </div>
      )}

      {item.stemEn && item.type !== 'handwrite' && (
        <p className="text-sm text-[var(--color-slate-soft)] mt-3">{item.stemEn}</p>
      )}

      {/* Answer surface */}
      <div className="mt-5">
        {item.options && (
          <div className="grid gap-2">
            {item.options.map((o) => {
              const isChosen = selected === o.id;
              const state =
                feedback && isChosen ? (feedback.correct ? 'correct' : 'wrong') : '';
              return (
                <button
                  key={o.id}
                  disabled={locked}
                  onClick={() => {
                    sfx('select');
                    setSelected(o.id);
                    onAnswer(o.id);
                  }}
                  className={`btn btn-choice ${state}`}
                >
                  {o.zh && <span className="zh text-lg mr-2">{o.zh}</span>}
                  {o.pinyin && (
                    <span className="text-lg font-semibold text-[var(--color-jade-bright)] mr-2">
                      {o.pinyin}
                    </span>
                  )}
                  {o.en && <span className="text-sm text-[var(--color-paper-dim)]">{o.en}</span>}
                </button>
              );
            })}
          </div>
        )}

        {item.type === 'handwrite' && item.writeChar && (
          <div className="py-2">
            <p className="text-center text-sm text-[var(--color-slate-soft)] mb-3">{item.stemEn}</p>
            <HanziPad
              char={item.writeChar}
              onDone={(score) => onAnswer(String(score))}
            />
          </div>
        )}

        {item.type === 'read-aloud' && (
          <Recorder
            targetText={item.stem}
            disabled={locked}
            onResult={(transcript, audio) => onAnswer(transcript, { audio })}
          />
        )}

        {(item.type === 'writing' || item.type === 'practical-writing') && (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              disabled={locked}
              placeholder="写在这里……"
              className="zh w-full rounded-lg bg-[#111925] border border-[#2f3d52] p-3 text-[15px] outline-none focus:border-[var(--color-jade)]"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[var(--color-slate-soft)]">
                {[...text].filter((c) => /[一-鿿]/u.test(c)).length} 字
                {item.minChars ? ` / ${item.minChars} minimum` : ''}
              </span>
              <button
                className="btn btn-primary"
                disabled={locked || !text.trim()}
                onClick={() => onAnswer(text)}
              >
                Hand it in
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      {item.hintEn && !feedback && (
        <div className="mt-4">
          {hintShown ? (
            <p className="text-sm text-[var(--color-gold)] leading-relaxed">💡 {item.hintEn}</p>
          ) : (
            <button
              className="text-xs text-[var(--color-slate-soft)] underline underline-offset-4"
              onClick={() => setHintShown(true)}
            >
              Stuck? Show a hint
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-5 pt-4 border-t border-[#2a3648]"
        >
          <p
            className={`font-semibold ${
              feedback.correct === true
                ? 'text-[var(--color-jade-bright)]'
                : feedback.correct === false
                  ? 'text-[var(--color-cinnabar)]'
                  : 'text-[var(--color-gold)]'
            }`}
          >
            {feedback.correct === true ? '对了' : feedback.correct === false ? '再想想' : '收到'}
          </p>
          {/* The reading first, then the explanation. The reading is the thing
              he is least likely to have supplied for himself while answering. */}
          {feedback.reveal && (
            <RevealCard reveal={feedback.reveal} correct={feedback.correct} />
          )}
          <p className="text-sm mt-3 text-[var(--color-paper-dim)] leading-relaxed">{feedback.en}</p>
          {feedback.zh && <p className="zh text-sm mt-1 text-[var(--color-slate-soft)]">{feedback.zh}</p>}
        </motion.div>
      )}
    </motion.div>
  );
}
