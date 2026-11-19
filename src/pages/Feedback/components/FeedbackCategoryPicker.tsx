import { useRef } from 'react';
import type { FeedbackCategory } from '@/types/feedback';
import { cn } from '@/lib/utils';
import { CATEGORY_NAMES, CATEGORY_STYLES } from './feedback-categories';

const CATEGORY_DESCRIPTIONS: Record<FeedbackCategory, string> = {
  BUG: 'Algo no funciona o se ve mal',
  IDEA: 'Propuesta para la plataforma',
  ECO_ACTION: 'Sugerir acción o campaña',
  ACCESSIBILITY: 'Vista, colores o teclado',
  OTHER: 'Duda o comentario general',
};

const CATEGORIES = (Object.keys(CATEGORY_DESCRIPTIONS) as FeedbackCategory[]).map(value => ({
  value,
  label: CATEGORY_NAMES[value],
  description: CATEGORY_DESCRIPTIONS[value],
  icon: CATEGORY_STYLES[value].icon,
}));

interface FeedbackCategoryPickerProps {
  value: FeedbackCategory;
  onChange: (category: FeedbackCategory) => void;
  disabled?: boolean;
}

export function FeedbackCategoryPicker({
  value,
  onChange,
  disabled = false,
}: FeedbackCategoryPickerProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % CATEGORIES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      const nextOption = CATEGORIES[nextIndex];
      if (nextOption) {
        onChange(nextOption.value);
        itemRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Tipo de comentario"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {CATEGORIES.map((category, index) => {
        const Icon = category.icon;
        const isSelected = value === category.value;

        return (
          <button
            key={category.value}
            ref={el => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(category.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            className={cn(
              'flex items-start gap-3.5 p-4 rounded-2xl border text-left cursor-pointer transition-all min-h-16',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              disabled && 'opacity-60 cursor-not-allowed',
              isSelected
                ? CATEGORY_STYLES[category.value].card
                : 'border-border bg-card hover:bg-muted/40',
            )}
          >
            <div
              className={cn(
                'size-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors',
                isSelected
                  ? CATEGORY_STYLES[category.value].classes
                  : 'border-transparent bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{category.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
