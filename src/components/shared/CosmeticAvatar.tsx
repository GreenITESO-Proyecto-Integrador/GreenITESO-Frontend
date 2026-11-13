import { useState } from 'react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { safeImageUrl } from '@/lib/safe-image-url';

interface CosmeticAvatarProps {
  /** Photo URL; empty or missing shows the initials. */
  src?: string | null;
  /** Name the initials and the image's alt text come from. */
  name: string;
  /** Size, shape and font size of the avatar, e.g. `size-11 rounded-xl text-sm`. */
  className?: string;
  /** Image of the avatar frame the person picked; empty or missing shows none. */
  frameUrl?: string | null;
}

/** The frame image. If it fails to load it disappears instead of leaving a broken-image icon. */
function FrameImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      data-testid="avatar-frame"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="pointer-events-none absolute inset-0 z-10 size-full scale-[1.14] object-contain select-none"
    />
  );
}

/**
 * A `UserAvatar` with the person's cosmetic frame drawn over it, the way their profile shows it.
 * The frame is a little larger than the photo and ignores clicks.
 */
export function CosmeticAvatar({ frameUrl, ...avatar }: CosmeticAvatarProps) {
  const frame = safeImageUrl(frameUrl);

  return (
    <div className="relative inline-flex shrink-0">
      <UserAvatar {...avatar} />
      {frame ? <FrameImage key={frame} url={frame} /> : null}
    </div>
  );
}
