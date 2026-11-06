import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CosmeticBackdropProps {
  /** Image of the profile background the person picked; empty or missing shows none. */
  url?: string | null;
  /** Classes for the box, e.g. its padding, border and rounded corners. */
  className?: string;
  children: ReactNode;
}

/**
 * A box showing the person's profile background behind its content, softened by the card color so
 * the text on top stays readable. Without a background it is just the box.
 */
export function CosmeticBackdrop({ url, className, children }: CosmeticBackdropProps) {
  if (!url) return <div className={className}>{children}</div>;

  return (
    <div className={cn('relative overflow-hidden', className)} data-testid="cosmetic-backdrop">
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover select-none"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-card/85 backdrop-blur-[2px] transition-colors dark:bg-card/90"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
