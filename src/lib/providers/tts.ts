/**
 * Text-to-speech.
 *
 * Interface first, providers behind it. With no keys the app still talks: the
 * browser's Web Speech API speaks zh-CN on every modern platform. With an Azure
 * key it pre-renders neural voices to disk at build time and the player gets
 * distinct, cached, offline-capable character voices.
 *
 * Pre-rendering matters more than voice quality here. Web Speech cannot be
 * cached, cannot be downloaded for offline play, and cannot be karaoke-timed
 * per word - all three of which the story mode wants. So `plan()` always
 * produces the full list of clips a chapter needs, whether or not we can render
 * them yet, and the client falls back per-clip.
 */
import crypto from 'node:crypto';

export type VoiceRole = 'narrator' | 'you' | 'auntie' | 'man' | 'elder' | 'child' | 'system';

export interface Voice {
  role: VoiceRole;
  /** Azure neural voice name. */
  azure: string;
  /** Hints handed to the Web Speech fallback. */
  web: { pitch: number; rate: number };
  label: string;
}

/**
 * One voice per role, fixed.
 *
 * A character who changes voice between chapters breaks the illusion harder
 * than a slightly wrong voice does, so the mapping is data, not a heuristic.
 * All are zh-CN neural voices (Putonghua, as the brief requires).
 */
export const VOICES: Record<VoiceRole, Voice> = {
  narrator: { role: 'narrator', azure: 'zh-CN-YunxiNeural', web: { pitch: 0.95, rate: 0.85 }, label: '旁白' },
  you: { role: 'you', azure: 'zh-CN-YunyangNeural', web: { pitch: 1.05, rate: 0.9 }, label: '你' },
  auntie: { role: 'auntie', azure: 'zh-CN-XiaoxiaoNeural', web: { pitch: 1.0, rate: 0.85 }, label: '阿姨' },
  man: { role: 'man', azure: 'zh-CN-YunjianNeural', web: { pitch: 0.85, rate: 0.85 }, label: '男声' },
  elder: { role: 'elder', azure: 'zh-CN-YunfengNeural', web: { pitch: 0.8, rate: 0.78 }, label: '长者' },
  child: { role: 'child', azure: 'zh-CN-XiaoyouNeural', web: { pitch: 1.25, rate: 0.9 }, label: '小孩' },
  system: { role: 'system', azure: 'zh-CN-XiaohanNeural', web: { pitch: 1.0, rate: 0.95 }, label: '系统' },
};

export function voiceFor(speaker: string): Voice {
  return VOICES[speaker as VoiceRole] ?? VOICES.narrator;
}

/** Stable cache key: same text + same voice -> same file, forever. */
export function clipId(text: string, role: string): string {
  return crypto.createHash('sha1').update(`${role}::${text}`).digest('hex').slice(0, 16);
}

export function clipUrl(id: string): string {
  return `/audio/tts/${id}.mp3`;
}

export interface ClipPlan {
  id: string;
  text: string;
  role: string;
  azureVoice: string;
  web: { pitch: number; rate: number };
  url: string;
  /**
   * True when a pre-rendered mp3 is expected to exist at `url`.
   *
   * Pre-rendered clips are produced at build time and served as static files,
   * so at request time this is a statement about the build, not a filesystem
   * check - there is no filesystem to check on Cloudflare. Clips that were
   * never rendered simply 404 and the client falls back to browser speech,
   * which is what it does when no Azure key is configured anyway.
   */
  cached: boolean;
}

export function planClip(text: string, speaker: string): ClipPlan {
  const voice = voiceFor(speaker);
  const id = clipId(text, voice.role);
  return {
    id,
    text,
    role: voice.role,
    azureVoice: voice.azure,
    web: voice.web,
    url: clipUrl(id),
    cached: false,
  };
}

export function azureConfigured(): boolean {
  return Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
}

/**
 * Render one clip with Azure and write it to the cache.
 * Returns false (rather than throwing) when unconfigured, so callers can treat
 * "no key" and "render failed" the same way: fall back to Web Speech.
 */
/**
 * Render one clip and hand back the audio.
 *
 * It used to write the mp3 into public/audio/tts and return whether that
 * worked. Cloudflare Workers have no filesystem, and nothing in the app ever
 * called it - the player falls back to the browser's own speech synthesis when
 * no Azure key is set, which is the path everything actually uses. Returning
 * the bytes leaves the integration usable by a caller that wants to store or
 * stream them, without deciding here where they go.
 */
export async function renderClip(text: string, speaker: string): Promise<Uint8Array | null> {
  if (!azureConfigured()) return null;
  const plan = planClip(text, speaker);

  const region = process.env.AZURE_SPEECH_REGION!;
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">` +
    `<voice name="${plan.azureVoice}"><prosody rate="-10%">${escapeXml(text)}</prosody></voice></speak>`;

  try {
    const res = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
          'User-Agent': 'HanziQuest',
        },
        body: ssml,
      },
    );
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    // Anything this short is an error page, not audio.
    if (buf.length < 512) return null;
    return buf;
  } catch {
    return null;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
