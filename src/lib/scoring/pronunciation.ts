/**
 * Pronunciation scoring.
 *
 * Two backends behind one interface:
 *
 *   azure     - Azure Speech Pronunciation Assessment (zh-CN). Real per-phoneme
 *               accuracy, fluency and completeness. Requires a key.
 *   webspeech - the browser's own recognition, which returns only a transcript.
 *               We score by comparing that transcript to the target.
 *
 * The fallback is genuinely weaker and the UI says so rather than presenting a
 * made-up number as if it were phonetic analysis. But it is not useless: for a
 * learner whose main problem is tones, a recogniser that hears 买 when the
 * target was 卖 has told you something real, and `toneErrors` extracts exactly
 * that signal.
 */
import { pinyinOf, toneOf, isHanzi } from '../lexicon';
import { pinyin } from 'pinyin-pro';

export interface PronunciationScore {
  /** 0-1 overall, the number the game uses for pass/fail. */
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  /** Per-character detail for the highlight overlay. */
  chars: {
    char: string;
    expected: string;
    heard?: string;
    ok: boolean;
    /** Set when the character was right but the tone was not. */
    toneError?: { expected: number; heard: number };
  }[];
  /** Tone confusions found, as "2v3" style tags for the error log. */
  toneErrors: string[];
  backend: 'azure' | 'webspeech' | 'none';
  /** Shown to the player when the score is weaker than it looks. */
  caveat?: string;
}

const strip = (s: string) => [...s].filter(isHanzi).join('');

/**
 * Levenshtein alignment of what was said against what should have been said.
 *
 * Used rather than a naive index-by-index comparison because a learner who
 * drops or inserts one character would otherwise score zero on everything after
 * it, which is both wrong and demoralising.
 */
function align(expected: string, heard: string): (readonly [string | null, string | null])[] {
  const a = [...expected];
  const b = [...heard];
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  const out: (readonly [string | null, string | null])[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      out.push([a[i - 1], b[j - 1]] as const);
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      out.push([a[i - 1], null] as const);
      i--;
    } else {
      out.push([null, b[j - 1]] as const);
      j--;
    }
  }
  return out.reverse();
}

/**
 * Score a transcript against a target.
 *
 * A homophone or near-homophone substitution is treated as a TONE error rather
 * than a plain miss, because that is what it almost always is: the recogniser
 * heard the right syllable with the wrong tone and picked a different character.
 * That distinction is what makes the fallback worth having - it feeds the tone
 * arcade with real, personal confusion pairs.
 */
export function scoreTranscript(target: string, transcript: string): PronunciationScore {
  const expected = strip(target);
  const heard = strip(transcript);

  if (!expected) {
    return {
      overall: 0,
      accuracy: 0,
      fluency: 0,
      completeness: 0,
      chars: [],
      toneErrors: [],
      backend: 'webspeech',
      caveat: 'Nothing to compare against.',
    };
  }

  const pairs = align(expected, heard);
  const chars: PronunciationScore['chars'] = [];
  const toneErrors: string[] = [];
  let matched = 0;

  for (const [exp, got] of pairs) {
    if (exp === null) continue; // inserted syllable; counts against fluency only
    const expPinyin = pinyin(exp, { toneType: 'symbol' });
    if (got === exp) {
      matched++;
      chars.push({ char: exp, expected: expPinyin, heard: expPinyin, ok: true });
      continue;
    }
    if (got === null) {
      chars.push({ char: exp, expected: expPinyin, ok: false });
      continue;
    }
    const expBase = pinyin(exp, { toneType: 'none' });
    const gotBase = pinyin(got, { toneType: 'none' });
    if (expBase === gotBase) {
      // Same syllable, different character: a tone slip.
      const e = toneOf(exp);
      const h = toneOf(got);
      if (e !== h) toneErrors.push(`${e}v${h}`);
      chars.push({
        char: exp,
        expected: expPinyin,
        heard: pinyin(got, { toneType: 'symbol' }),
        ok: false,
        toneError: { expected: e, heard: h },
      });
      // A tone slip is a partial credit, not a zero.
      matched += 0.5;
    } else {
      chars.push({
        char: exp,
        expected: expPinyin,
        heard: pinyin(got, { toneType: 'symbol' }),
        ok: false,
      });
    }
  }

  const accuracy = matched / expected.length;
  const completeness = Math.min(1, heard.length / expected.length);
  // No timing data from a transcript, so fluency is inferred from how much of
  // the target survived intact. Honest, and flagged in `caveat`.
  const fluency = accuracy * 0.5 + completeness * 0.5;

  return {
    overall: Math.round((accuracy * 0.6 + completeness * 0.25 + fluency * 0.15) * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
    fluency: Math.round(fluency * 100) / 100,
    completeness: Math.round(completeness * 100) / 100,
    chars,
    toneErrors: [...new Set(toneErrors)],
    backend: 'webspeech',
    caveat:
      'Scored by matching what the browser heard against the target. It catches wrong syllables and tone slips, but it cannot judge how your mouth is shaping the sound. Add an AZURE_SPEECH_KEY for real phoneme-level scoring.',
  };
}

/** Shape returned by Azure Pronunciation Assessment, narrowed to what we use. */
export interface AzureAssessment {
  NBest?: {
    PronunciationAssessment?: {
      AccuracyScore: number;
      FluencyScore: number;
      CompletenessScore: number;
      PronScore: number;
    };
    Words?: {
      Word: string;
      PronunciationAssessment?: { AccuracyScore: number; ErrorType: string };
    }[];
  }[];
}

export function scoreFromAzure(target: string, raw: AzureAssessment): PronunciationScore {
  const best = raw.NBest?.[0];
  const pa = best?.PronunciationAssessment;
  const chars: PronunciationScore['chars'] = [];

  for (const w of best?.Words ?? []) {
    for (const ch of w.Word) {
      if (!isHanzi(ch)) continue;
      const acc = (w.PronunciationAssessment?.AccuracyScore ?? 0) / 100;
      chars.push({
        char: ch,
        expected: pinyin(ch, { toneType: 'symbol' }),
        ok: acc >= 0.6 && w.PronunciationAssessment?.ErrorType === 'None',
      });
    }
  }

  return {
    overall: (pa?.PronScore ?? 0) / 100,
    accuracy: (pa?.AccuracyScore ?? 0) / 100,
    fluency: (pa?.FluencyScore ?? 0) / 100,
    completeness: (pa?.CompletenessScore ?? 0) / 100,
    chars: chars.length ? chars : [...strip(target)].map((c) => ({
      char: c,
      expected: pinyin(c, { toneType: 'symbol' }),
      ok: true,
    })),
    toneErrors: [],
    backend: 'azure',
  };
}

/** Weakest tones, for picking the arcade drill after a read-aloud. */
export function weakestTones(tags: string[]): { pair: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count);
}

/** Expected reading of a whole line, for the UI to show alongside the score. */
export function expectedReading(text: string): string {
  return pinyinOf(text);
}
