'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * An image from the art manifest, with a graceful two-step fallback.
 *
 * Art is generated at build time by scripts/gen-art.ts. A chapter written at
 * runtime has a manifest entry marked `pending` and no file yet, so this
 * degrades: named fallback asset, then a drawn placeholder. It never renders a
 * broken image and never blocks a chapter.
 *
 * Why this is not just `<img onError>`: the element is server-rendered, so a
 * missing file 404s before React has attached the handler and `onError` never
 * fires - leaving the browser's broken-image glyph on screen. So the placeholder
 * is the default, the image fades in only once it has actually decoded, and a
 * mount-time `naturalWidth === 0` check catches the load that already failed.
 */
export default function ArtImage({
  id,
  alt,
  className = '',
  fallbackId,
}: {
  id: string;
  alt: string;
  className?: string;
  fallbackId?: string;
}) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  const src =
    stage === 0
      ? `/art/${id}-768.webp`
      : stage === 1 && fallbackId
        ? `/art/${fallbackId}-768.webp`
        : null;

  function next() {
    setLoaded(false);
    setStage((s) => (s === 0 && fallbackId ? 1 : 2));
  }

  // Catch the failure that happened before hydration.
  useEffect(() => {
    const img = ref.current;
    if (!img || !src) return;
    if (img.complete) {
      if (img.naturalWidth === 0) next();
      else setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {/* Placeholder sits underneath and is simply covered once art loads. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center bg-[#111925] text-[var(--color-slate)]"
      >
        <span className="text-3xl opacity-30">▨</span>
      </span>

      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth === 0) next();
            else setLoaded(true);
          }}
          onError={next}
          className={`relative w-full h-full object-cover transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {!src && <span className="sr-only">{alt} (art not generated yet)</span>}
    </span>
  );
}
