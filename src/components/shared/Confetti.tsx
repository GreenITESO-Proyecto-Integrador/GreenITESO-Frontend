import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// Greens from the design system plus the impact colors (water, plastic, sun).
const PIECE_COLORS = [
  'bg-primary-300',
  'bg-primary-500',
  'bg-primary-700',
  'bg-emerald-400',
  'bg-sky-400',
  'bg-amber-300',
];
const PIECE_COUNT = 40;

/**
 * A fixed pattern instead of Math.random(), so every render draws the same
 * confetti and it is easy to tweak: each value just cycles through a range.
 */
const PIECES = Array.from({ length: PIECE_COUNT }, (_, index) => {
  const size = 8 + (index % 3) * 4;
  const isLeaf = index % 3 !== 0;
  return {
    left: (index * 37) % 100,
    width: size,
    height: isLeaf ? size * 1.6 : size,
    isLeaf,
    color: PIECE_COLORS[index % PIECE_COLORS.length],
    style: {
      animationDelay: `${(index % 10) * 0.12}s`,
      animationDuration: `${2.4 + (index % 5) * 0.35}s`,
      // Read by the `confetti-fall` keyframes in index.css.
      '--confetti-drift': `${((index % 7) - 3) * 40}px`,
      '--confetti-spin': `${(index % 2 ? 1 : -1) * (360 + (index % 4) * 180)}deg`,
    } as CSSProperties,
  };
});

/** Falling leaves and dots over the whole screen. Purely decorative. */
export function Confetti() {
  return (
    <div
      aria-hidden="true"
      data-testid="confetti"
      className="pointer-events-none fixed inset-0 z-60 overflow-hidden motion-reduce:hidden"
    >
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className={cn(
            'absolute -top-6 block animate-confetti-fall',
            piece.color,
            // A leaf is a square with two opposite corners fully rounded.
            piece.isLeaf ? 'rounded-[0_100%_0_100%]' : 'rounded-full',
          )}
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.height,
            ...piece.style,
          }}
        />
      ))}
    </div>
  );
}
