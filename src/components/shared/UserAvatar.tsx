import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/clan-meta';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  /** Photo URL; empty or missing shows the initials. */
  src?: string | null;
  /** Name the initials and the image's alt text come from. */
  name: string;
  /** Size, shape and font size of the avatar, e.g. `size-11 rounded-xl text-sm`. */
  className?: string;
  /** Hide the image from assistive tech when a nearby label already names the user. */
  decorative?: boolean;
}

/**
 * A user's profile photo, falling back to their initials while it loads, when
 * there is none, or when it fails to load.
 */
export function UserAvatar({ src, name, className, decorative = false }: UserAvatarProps) {
  return (
    <Avatar
      className={cn(
        'rounded-full font-extrabold after:rounded-[inherit] [&>*]:rounded-[inherit]',
        className,
      )}
    >
      {src ? <AvatarImage src={src} alt={decorative ? '' : name} /> : null}
      <AvatarFallback className="bg-linear-to-br from-primary-500 to-primary-700 text-[length:inherit] text-white">
        <span aria-hidden="true">{getInitials(name)}</span>
      </AvatarFallback>
    </Avatar>
  );
}
