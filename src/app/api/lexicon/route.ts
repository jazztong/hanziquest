import { lookupChar, lookupWord, readingsOf, isPolyphonic, rarityOf, pinyinOf } from '@/lib/lexicon';
import { requireUser } from '@/lib/auth';
import { route } from '@/lib/api';

/**
 * Character / word lookup for tap-to-gloss.
 *
 * `context` matters: for a 多音字 the correct reading depends on the sentence,
 * so the client sends the line it came from and we resolve the reading there
 * rather than handing back the dominant one. This is the difference between
 * teaching 行 as xíng always and teaching it correctly.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const context = url.searchParams.get('context') ?? '';
  const index = Number(url.searchParams.get('index') ?? '-1');

  return route(async () => {
    await requireUser();
    if (!q) return { found: false };

    const isSingle = [...q].length === 1;
    const char = isSingle ? lookupChar(q) : undefined;
    const word = !isSingle ? lookupWord(q) : undefined;

    let reading = isSingle ? readingsOf(q)[0] ?? '' : pinyinOf(q);
    let ambiguous = false;

    if (isSingle && isPolyphonic(q)) {
      ambiguous = true;
      if (context && index >= 0) {
        const syllables = pinyinOf(context).split(/\s+/);
        // pinyinOf joins syllables with spaces in input order, so the nth
        // syllable corresponds to the nth 汉字 of the context.
        const hanziBefore = [...context.slice(0, index)].filter((c) => /[一-鿿]/u.test(c)).length;
        reading = syllables[hanziBefore] ?? reading;
      }
    }

    return {
      found: Boolean(char || word),
      value: q,
      reading,
      ambiguous,
      allReadings: isSingle ? readingsOf(q) : [],
      gloss: char?.gloss ?? word?.gloss ?? '',
      band: char?.band ?? word?.band ?? null,
      radical: char?.radical ?? '',
      rarity: isSingle ? rarityOf(q) : null,
    };
  });
}
