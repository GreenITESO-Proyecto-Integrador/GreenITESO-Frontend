import { cn } from '@/lib/utils';

interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Single-choice filter as a row of pill buttons (44px touch targets).
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
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
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-border bg-card text-foreground hover:border-secondary-200',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
