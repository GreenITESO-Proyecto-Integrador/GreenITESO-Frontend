import { UserAvatar } from '@/components/shared/UserAvatar';

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

/**
 * A `UserAvatar` with the person's cosmetic frame drawn over it, the way their profile shows it.
 * The frame is a little larger than the photo and ignores clicks.
 */
export function CosmeticAvatar({ frameUrl, ...avatar }: CosmeticAvatarProps) {
  return (
    <div className="relative inline-flex shrink-0">
      <UserAvatar {...avatar} />
      {frameUrl ? (
        <img
          src={frameUrl}
          alt=""
          aria-hidden="true"
          data-testid="avatar-frame"
          className="pointer-events-none absolute inset-0 z-10 size-full scale-[1.14] object-contain select-none"
        />
      ) : null}
    </div>
  );
}
