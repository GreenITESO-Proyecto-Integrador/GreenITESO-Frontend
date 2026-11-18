import { useRef } from 'react';
import { AlertTriangle, Eye, Leaf, MessageSquare, Sparkles } from 'lucide-react';
import type { FeedbackCategory } from '@/types/feedback';
import { cn } from '@/lib/utils';

interface CategoryOption {
  value: FeedbackCategory;
  label: string;
  description: string;
  icon: typeof AlertTriangle;
}

const CATEGORIES: CategoryOption[] = [
  {
    value: 'BUG',
    label: 'Error técnico',
    description: 'Algo no funciona o se ve mal',
    icon: AlertTriangle,
  },
  {
    value: 'IDEA',
    label: 'Idea o mejora',
    description: 'Propuesta para la plataforma',
    icon: Sparkles,
  },
  {
    value: 'ECO_ACTION',
    label: 'Nueva acción eco',
    description: 'Sugerir acción o campaña',
    icon: Leaf,
  },
  {
    value: 'ACCESSIBILITY',
    label: 'Accesibilidad',
    description: 'Vista, colores o teclado',
    icon: Eye,
  },
  {
    value: 'OTHER',
    label: 'Otro comentario',
    description: 'Duda o comentario general',
    icon: MessageSquare,
  },
];

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
                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/40 ring-2 ring-primary-500/20'
                : 'border-border bg-card hover:bg-muted/40',
            )}
          >
            <div
              className={cn(
                'size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                isSelected
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-muted text-muted-foreground',
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
