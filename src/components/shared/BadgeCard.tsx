import { Award, Leaf, Shield, Star, Zap, Droplet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogBadge } from '@/lib/api/badges';

// Closed map to avoid importing the entire lucide-react library
const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Leaf,
  Shield,
  Star,
  Zap,
  Droplet,
};

interface BadgeCardProps {
  badge: CatalogBadge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  // Fallback to 'Award' if the icon string doesn't match the map or is undefined
  const LucideIcon = ICON_MAP[badge.icon || 'Award'] || Award;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl border text-center transition-all h-full',
        badge.isEarned
          ? 'bg-primary-50 border-primary-200 shadow-sm dark:bg-primary-900/20 dark:border-primary-800'
          : 'bg-secondary-50 border-secondary-100 opacity-75 grayscale dark:bg-secondary-900/20 dark:border-secondary-800',
      )}
    >
      <div
        className={cn(
          'p-3 rounded-full mb-3 flex items-center justify-center',
          badge.isEarned
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
            : 'bg-secondary-200 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-500',
        )}
      >
        <LucideIcon className="size-6" />
      </div>

      <h3
        className={cn(
          'text-sm font-bold mb-1',
          badge.isEarned
            ? 'text-primary-800 dark:text-primary-300'
            : 'text-secondary-500 dark:text-secondary-400',
        )}
      >
        {badge.name}
      </h3>

      <p className="text-xs text-secondary-300 dark:text-secondary-500 line-clamp-2 mt-auto">
        {badge.description}
      </p>

      <div className="mt-3 text-[10px] font-semibold tracking-wider text-secondary-400 dark:text-secondary-600 uppercase">
        {badge.isEarned && badge.unlockedAt
          ? `Obtenida el ${new Date(badge.unlockedAt).toLocaleDateString()}`
          : `Requiere ${badge.pointsRequired} pts`}
      </div>
    </div>
  );
}
