/**
 * The chapter script format.
 *
 * A chapter is a small directed graph of nodes, not a linear page of text. That
 * is what makes "progress is gated on comprehension" possible: a choice node
 * branches on what the player understood, and a wrong reading routes to a
 * `detour` node that costs time and teaches the misread word, then rejoins the
 * spine. There is no losing node and no dead end - `detour` always names where
 * it rejoins.
 *
 * Every line carries its own audio key so the TTS layer can pre-render per line
 * and the karaoke highlighter can sync per line without re-splitting text at
 * runtime.
 */

export type NodeId = string;

/** Who is speaking. `narrator` is the story voice; ids match the cast in the bible. */
export type SpeakerId = string;

export interface Line {
  /** Stable within the chapter; used as the audio cache key. */
  id: string;
  speaker: SpeakerId;
  zh: string;
  /**
   * English gloss for the whole line. Shown at low mastery, faded out as the
   * player's coverage of this chapter's characters rises past `glossFadeAt`.
   */
  en: string;
  /** Optional scene art override for this line. */
  artId?: string;
}

export interface Choice {
  id: string;
  /** The option text, in Chinese. Held to the `choice` coverage band (>=97%). */
  zh: string;
  en: string;
  /** Where this option leads. */
  to: NodeId;
  /**
   * True when this option shows the player understood the clue.
   * At least one choice per node must be correct; more than one may be.
   */
  correct: boolean;
  /** Shown after choosing, in English, explaining what the clue actually said. */
  feedback?: string;
}

export interface NarrationNode {
  id: NodeId;
  kind: 'narration';
  lines: Line[];
  next: NodeId | null;
  artId?: string;
}

export interface ChoiceNode {
  id: NodeId;
  kind: 'choice';
  /** The clue the player must actually read to choose well. */
  lines: Line[];
  /** The question, in Chinese, with an English gloss. */
  promptZh: string;
  promptEn: string;
  choices: Choice[];
  artId?: string;
}

/**
 * A recoverable wrong turn. Never a game over - the brief is explicit about this,
 * and docs/research.md section 5.3 explains why: loss penalties suppress
 * voluntary practice in adolescents.
 */
export interface DetourNode {
  id: NodeId;
  kind: 'detour';
  lines: Line[];
  /** The word or character the player misread, re-taught here. */
  teaches: string[];
  /** Always set. The detour costs time and rejoins the spine. */
  rejoin: NodeId;
  artId?: string;
}

/** Read a line aloud to make something happen. Pronunciation decides the outcome. */
export interface SpeakNode {
  id: NodeId;
  kind: 'speak';
  lines: Line[];
  /** The exact line the player must read aloud. */
  targetZh: string;
  targetEn: string;
  /** What it is framed as: a spell, a password, persuading someone. */
  framing: string;
  /** 0-1. At or above this the attempt succeeds outright. */
  passScore: number;
  onPass: NodeId;
  /** Below passScore. Never a failure node - a partial success with a cost. */
  onPartial: NodeId;
  artId?: string;
}

export interface EndNode {
  id: NodeId;
  kind: 'end';
  lines: Line[];
  /** Short English wrap-up shown over the reward screen. */
  outro: string;
  artId?: string;
}

export type StoryNode =
  | NarrationNode
  | ChoiceNode
  | DetourNode
  | SpeakNode
  | EndNode;

export interface TargetWord {
  /** The word or single character being taught. */
  zh: string;
  /** Pinyin is filled in from the dictionary at build/serve time, never authored. */
  en: string;
  /** Where it first appears, so the card can say "found in chapter N". */
  lineId: string;
}

export interface ChapterScript {
  /** Node to start at. */
  start: NodeId;
  nodes: StoryNode[];
  /** 5-10 words this chapter exists to teach. */
  targets: TargetWord[];
  /**
   * Names of people and places used in this chapter.
   *
   * Their characters are excluded from the coverage denominator entirely. A
   * name like 林阿姨 is three band-4 characters; charging a chapter a tenth of
   * its coverage budget for naming its own cast measures nothing useful. Names
   * are taught once, glossed permanently in the cast list, and never quizzed.
   */
  properNouns?: string[];
  /**
   * Coverage of this chapter's characters at which the English gloss stops
   * being shown by default. The brief asks for English to fade as mastery grows.
   */
  glossFadeAt: number;
  /** Estimated minutes, for the daily plan. */
  minutes: number;
}

/** All Chinese prose in a chapter, for the coverage gate. */
export function chapterText(script: ChapterScript): string {
  const out: string[] = [];
  for (const node of script.nodes) {
    for (const l of node.lines) out.push(l.zh);
    if (node.kind === 'choice') {
      out.push(node.promptZh);
      for (const c of node.choices) out.push(c.zh);
    }
    if (node.kind === 'speak') out.push(node.targetZh);
  }
  return out.join('');
}

/** Only the text held to the stricter `choice` band. */
export function choiceText(script: ChapterScript): string {
  const out: string[] = [];
  for (const node of script.nodes) {
    if (node.kind !== 'choice') continue;
    out.push(node.promptZh);
    for (const c of node.choices) out.push(c.zh);
  }
  return out.join('');
}

export function findNode(script: ChapterScript, id: NodeId): StoryNode | undefined {
  return script.nodes.find((n) => n.id === id);
}

/**
 * Structural validation, run before any chapter is accepted into the database.
 * Catches the failure modes that would strand a player mid-chapter.
 */
export function validateScript(script: ChapterScript): string[] {
  const errors: string[] = [];
  const ids = new Set(script.nodes.map((n) => n.id));

  if (!ids.has(script.start)) errors.push(`start node "${script.start}" does not exist`);
  if (ids.size !== script.nodes.length) errors.push('duplicate node ids');

  const ref = (from: string, to: string | null, label: string) => {
    if (to === null) return;
    if (!ids.has(to)) errors.push(`${from}: ${label} points at missing node "${to}"`);
  };

  let hasEnd = false;
  for (const n of script.nodes) {
    if (!n.lines.length && n.kind !== 'end') errors.push(`${n.id}: no lines`);
    switch (n.kind) {
      case 'narration':
        ref(n.id, n.next, 'next');
        break;
      case 'choice': {
        if (n.choices.length < 2) errors.push(`${n.id}: needs at least 2 choices`);
        if (!n.choices.some((c) => c.correct)) errors.push(`${n.id}: no correct choice`);
        for (const c of n.choices) ref(n.id, c.to, `choice "${c.id}"`);
        break;
      }
      case 'detour':
        ref(n.id, n.rejoin, 'rejoin');
        if (!n.teaches.length) errors.push(`${n.id}: detour teaches nothing`);
        break;
      case 'speak':
        ref(n.id, n.onPass, 'onPass');
        ref(n.id, n.onPartial, 'onPartial');
        if (n.onPartial === n.id) errors.push(`${n.id}: onPartial loops back to itself`);
        break;
      case 'end':
        hasEnd = true;
        break;
    }
  }
  if (!hasEnd) errors.push('chapter has no end node');

  // Reachability: a node nobody can get to is dead content.
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id) || !ids.has(id)) return;
    seen.add(id);
    const n = findNode(script, id)!;
    if (n.kind === 'narration' && n.next) walk(n.next);
    if (n.kind === 'choice') for (const c of n.choices) walk(c.to);
    if (n.kind === 'detour') walk(n.rejoin);
    if (n.kind === 'speak') {
      walk(n.onPass);
      walk(n.onPartial);
    }
  };
  walk(script.start);
  for (const n of script.nodes) {
    if (!seen.has(n.id)) errors.push(`${n.id}: unreachable`);
  }

  const targets = script.targets.length;
  if (targets < 5 || targets > 10) {
    errors.push(`chapter teaches ${targets} target words; the band is 5-10`);
  }

  return errors;
}
