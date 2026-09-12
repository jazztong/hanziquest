import { requireUser, AuthError } from '@/lib/auth';
import { available, askJson } from '@/lib/ai/claude';
import { isHanzi } from '@/lib/lexicon';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Read a photographed 课文 page into text.
 *
 * This is a digitising step for a page the family already owns, run on their own
 * machine: the image is sent to Claude for transcription, the text comes back,
 * the parent checks it, and it is saved locally. Nothing is stored by us, and
 * nothing is redistributed.
 *
 * The result is always shown to the parent for correction before it is saved.
 * OCR of printed Chinese is good but not perfect, and a mis-read character in a
 * 课文 becomes a mis-taught character downstream - the one failure this whole
 * app is built to avoid.
 */
export async function POST(req: Request) {
  return route(async () => {
    const user = await requireUser();
    if (user.role !== 'parent') throw new AuthError('parent account required');

    const input = await body<{
      images: { mediaType: string; base64: string }[];
      hint?: string;
    }>(req);

    if (!input.images?.length) throw new BadRequest('at least one page image is required');
    if (input.images.length > 6) throw new BadRequest('six pages at a time, maximum');

    if (!available()) {
      throw new BadRequest(
        'Reading a photo needs an ANTHROPIC_API_KEY in .env. Without one, type or paste the lesson text instead — everything downstream works the same way.',
      );
    }

    const result = await askJson<{ title: string; bookRef: string; text: string; vocab: string[] }>(
      {
        purpose: 'lesson-ocr',
        maxTokens: 4096,
        system: [
          'You transcribe photographed pages of a Chinese textbook into plain text.',
          '',
          'Rules:',
          '- Transcribe EXACTLY what is printed. Do not correct, modernise, simplify,',
          '  paraphrase or complete anything. If a character is unclear, use 〓.',
          '- Simplified characters only, as printed.',
          '- Keep paragraph breaks as blank lines. Drop page numbers, headers,',
          '  footers, running titles and exercise numbering.',
          '- Transcribe ONLY the lesson text (课文). Leave out 注释, 作者简介,',
          '   练习, 学习提示 and any surrounding apparatus.',
          '- If the pages contain no lesson text at all, return an empty text field.',
          '',
          'Return JSON: { "title": string, "bookRef": string, "text": string, "vocab": string[] }',
          '- title: the lesson title as printed (e.g. "第六课　春夜喜雨"), else "".',
          '- bookRef: book and lesson number if visible (e.g. "初一上册 第六课"), else "".',
          '- vocab: 生字新词 printed on the page as a list, else [].',
        ].join('\n'),
        user: input.hint
          ? `Transcribe these pages. Context from the parent: ${input.hint}`
          : 'Transcribe these pages.',
        images: input.images,
      },
      (raw) => {
        const r = raw as Record<string, unknown>;
        const text = typeof r.text === 'string' ? r.text : '';
        if (!text.trim()) throw new Error('no lesson text found on these pages');
        if (![...text].some(isHanzi)) throw new Error('transcription contains no Chinese');
        return {
          title: typeof r.title === 'string' ? r.title : '',
          bookRef: typeof r.bookRef === 'string' ? r.bookRef : '',
          text,
          vocab: Array.isArray(r.vocab) ? (r.vocab as string[]).filter((v) => typeof v === 'string') : [],
        };
      },
    );

    const chars = [...result.data.text].filter(isHanzi).length;
    return {
      ...result.data,
      chars,
      // Surfaced so the parent knows this still needs their eye.
      needsReview: true,
      unclear: (result.data.text.match(/〓/g) ?? []).length,
      model: result.model,
    };
  });
}
