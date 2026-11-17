import { useState } from 'react';
import { safeImageUrl } from '@/lib/safe-image-url';

function BackgroundLayers({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        data-testid="cosmetic-background"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="pointer-events-none absolute inset-0 -z-10 size-full object-cover select-none"
      />
      {/* Softens the picture with the card color, so the text on top stays readable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-card/90 backdrop-blur-[2px] transition-colors dark:bg-card/95"
      />
    </>
  );
}

/**
 * The person's profile background behind the content of its box. Put it first inside a box that
 * has `cosmeticHostClass(url)`; the content needs no wrapper. Renders nothing without a usable url.
 */
export function CosmeticBackground({ url }: { url?: string | null }) {
  const safe = safeImageUrl(url);
  return safe ? <BackgroundLayers key={safe} url={safe} /> : null;
}
