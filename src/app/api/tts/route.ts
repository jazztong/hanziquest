import { planClip, renderClip, azureConfigured } from '@/lib/providers/tts';
import { requireUser } from '@/lib/auth';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Returns a playable plan for a line, rendering it with Azure on first request
 * if a key is present. The client plays `url` when `cached` is true and falls
 * back to the Web Speech API with the supplied pitch/rate otherwise - which is
 * why the fallback hints ship even when Azure is configured.
 */
export async function POST(req: Request) {
  return route(async () => {
    const { text, speaker } = await body<{ text: string; speaker?: string }>(req);
    await requireUser();
    if (!text?.trim()) throw new BadRequest('no text');
    if (azureConfigured()) await renderClip(text, speaker ?? 'narrator');
    return { clip: planClip(text, speaker ?? 'narrator'), azure: azureConfigured() };
  });
}
