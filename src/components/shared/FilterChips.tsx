import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly {
    value: T;
    label: string;
    icon?: LucideIcon;
    /** Replaces the default selected colors for this option. */
    activeClassName?: string;
  }[];
  value: T;
  onChange: (value: T) => void;
  /** On small screens, lay the chips out as an even two-column grid instead of ragged rows. */
  balanced?: boolean;
}

/**
 * Single-choice filter as a row of pill buttons (44px touch targets).
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  balanced = false,
}: FilterChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex flex-wrap gap-2', balanced && 'grid grid-cols-2 sm:flex')}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
              selected
                ? (option.activeClassName ?? 'border-primary-500 bg-primary-500 text-white')
                : 'border-border bg-card text-foreground hover:border-secondary-200',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {option.icon ? <option.icon className="size-4" /> : null}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
