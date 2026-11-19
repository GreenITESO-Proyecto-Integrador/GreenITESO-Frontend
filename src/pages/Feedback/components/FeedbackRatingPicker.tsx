import { useRef } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackRatingPickerProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
}

const RATINGS = [
  { value: 1, label: '1 - Muy mala' },
  { value: 2, label: '2 - Regular' },
  { value: 3, label: '3 - Buena' },
  { value: 4, label: '4 - Muy buena' },
  { value: 5, label: '5 - Excelente' },
];

export function FeedbackRatingPicker({
  value,
  onChange,
  disabled = false,
}: FeedbackRatingPickerProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % RATINGS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + RATINGS.length) % RATINGS.length;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      const nextRating = RATINGS[nextIndex];
      if (nextRating) {
        onChange(nextRating.value);
        itemRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Calificación de la experiencia"
        className="flex flex-wrap items-center gap-2"
      >
        {RATINGS.map((item, index) => {
          const isSelected = value === item.value;
          const isFocusable = isSelected || (value === null && index === 0);
          return (
            <button
              key={item.value}
              ref={el => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isFocusable ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(isSelected ? null : item.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              className={cn(
                'flex size-11 items-center justify-center rounded-xl border text-sm font-bold transition-all cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                disabled && 'opacity-60 cursor-not-allowed',
                isSelected
                  ? 'border-amber-400 bg-amber-500 text-white shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={item.label}
              aria-label={item.label}
            >
              <span className="flex items-center gap-0.5">
                {item.value}
                <Star
                  className={cn(
                    'size-3.5',
                    isSelected ? 'fill-white text-white' : 'text-amber-500',
                  )}
                />
              </span>
            </button>
          );
        })}
        {value !== null && (
          <span aria-live="polite" className="text-xs font-semibold text-foreground px-1">
            {RATINGS.find(item => item.value === value)?.label}
          </span>
        )}
        {value !== null && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 px-2 min-h-11 cursor-pointer flex items-center"
          >
            Quitar calificación
          </button>
        )}
      </div>
    </div>
  );
}
