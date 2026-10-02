import { useState } from 'react';
import type { ExchangeableCategory, ExchangeableItem } from '@/types/store';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Coins, Frame, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ExchangeableCardProps {
  item: ExchangeableItem;
  isUnlocked: boolean;
  onBuyClick: (item: ExchangeableItem) => void;
}

const CATEGORY_META: Record<ExchangeableCategory, { label: string; icon: typeof Frame }> = {
  FRAME: { label: 'Marco', icon: Frame },
  BACKGROUND: { label: 'Fondo', icon: ImageIcon },
  THEME: { label: 'Fondo', icon: ImageIcon },
  OTHER: { label: 'Otro', icon: Sparkles },
};

export function ExchangeableCard({ item, isUnlocked, onBuyClick }: ExchangeableCardProps) {
  const [imgError, setImgError] = useState(false);
  const meta = CATEGORY_META[item.category] || CATEGORY_META.OTHER;
  const Icon = meta.icon;

  return (
    <Card className="flex flex-col justify-between rounded-2xl bg-card border border-border p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Bordered Image Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-secondary-100 bg-muted/40 dark:border-secondary-700">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <Icon className="size-6" />
            </div>
          </div>
        )}

        {/* Category Pill Tag */}
        <span className="absolute top-2 left-2 rounded-full border border-primary-200 bg-primary-50/90 px-2.5 py-0.5 text-xs font-semibold text-primary-700 backdrop-blur-xs dark:border-primary-800 dark:bg-primary-900/80 dark:text-primary-300">
          {meta.label}
        </span>

        {/* Unlocked status badge */}
        {isUnlocked && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
            <Check className="size-3" />
            Obtenido
          </span>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col justify-between p-0 pt-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground sm:text-lg">{item.name}</h3>
          <p className="mt-1 text-xs text-secondary-300 dark:text-muted-foreground line-clamp-2 min-h-[32px] sm:text-sm">
            {item.description || 'Sin descripción disponible.'}
          </p>
        </div>

        {/* Button */}
        <div className="pt-2">
          {isUnlocked ? (
            <button
              type="button"
              disabled
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-5 text-sm font-semibold text-muted-foreground cursor-not-allowed"
            >
              <Check className="size-4" />
              Canjeado
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBuyClick(item)}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
            >
              <Coins className="size-4" />
              <span>Canjear • {item.pointsCost} pts</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
