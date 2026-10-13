import { icons } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Badge } from '@/types/badge';

interface BadgeCardProps {
  badge: Badge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  // Resolve icon dynamically. Fallback to 'Award' if the provided icon_name is invalid.
  const LucideIcon = (icons[badge.icon_name as keyof typeof icons] ||
    icons.Award) as React.ElementType;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl border text-center transition-all h-full',
        badge.is_earned
          ? 'bg-primary-50 border-primary-200 shadow-sm'
          : 'bg-secondary-50 border-secondary-100 opacity-75 grayscale',
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          'p-3 rounded-full mb-3 flex items-center justify-center',
          badge.is_earned
            ? 'bg-primary-100 text-primary-600'
            : 'bg-secondary-200 text-secondary-400',
        )}
      >
        <LucideIcon className="size-6" />
      </div>

      {/* Badge Title */}
      <h3
        className={cn(
          'text-sm font-bold mb-1',
          badge.is_earned ? 'text-primary-800' : 'text-secondary-500',
        )}
      >
        {badge.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-secondary-300 line-clamp-2 mt-auto">{badge.description}</p>

      {/* Meta info (Required points or unlock date) */}
      <div className="mt-3 text-[10px] font-semibold tracking-wider text-secondary-400 uppercase">
        {badge.is_earned && badge.earned_at
          ? `Obtenida el ${new Date(badge.earned_at).toLocaleDateString()}`
          : `Requiere ${badge.points_required} pts`}
      </div>
    </div>
  );
}
