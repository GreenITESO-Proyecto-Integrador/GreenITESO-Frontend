import type React from 'react';
import type { ExchangeableCategory } from '@/types/store';
import { cn } from '@/lib/utils';
import { Award, Frame, Grid, Palette, Sparkles, Type } from 'lucide-react';

interface CategoryFilterTabsProps {
  selectedCategory: ExchangeableCategory | 'ALL';
  onSelectCategory: (category: ExchangeableCategory | 'ALL') => void;
}

const CATEGORY_OPTIONS: readonly { value: ExchangeableCategory | 'ALL'; label: string; icon: React.ElementType }[] = [
  { value: 'ALL', label: 'Todos', icon: Grid },
  { value: 'FRAME', label: 'Marcos', icon: Frame },
  { value: 'BACKGROUND', label: 'Fondos', icon: Palette },
  { value: 'OTHER', label: 'Otros', icon: Sparkles },
];

export function CategoryFilterTabs({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterTabsProps) {
  return (
    <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
      {CATEGORY_OPTIONS.map(option => {
        const selected = option.value === selectedCategory;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectCategory(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-11 cursor-pointer rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
              selected
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-border bg-card text-foreground hover:border-secondary-200 dark:hover:border-secondary-600',
            )}
          >
            <Icon size={15} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
