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
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Calificación de la experiencia"
        className="flex flex-wrap items-center gap-2"
      >
        {RATINGS.map(item => {
          const isSelected = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(isSelected ? null : item.value)}
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
