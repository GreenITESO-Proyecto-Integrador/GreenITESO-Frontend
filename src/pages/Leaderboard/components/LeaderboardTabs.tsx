import { cn } from '@/lib/utils';
import type { LeaderboardTab } from '@/types/leaderboard';

interface LeaderboardTabsProps {
  activeTab: LeaderboardTab;
  onChange: (tab: LeaderboardTab) => void;
}

/**
 * Switch between the global user ranking and the team ranking.
 */
export function LeaderboardTabs({ activeTab, onChange }: LeaderboardTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Tablas de clasificación"
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <button
        type="button"
        role="tab"
        id="tab-global"
        aria-selected={activeTab === 'global'}
        aria-controls="panel-global"
        onClick={() => onChange('global')}
        className={cn(
          'min-h-11 cursor-pointer rounded-xl px-5 text-sm font-semibold transition-colors',
          'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
          activeTab === 'global'
            ? 'bg-primary-500 text-white shadow-sm'
            : 'border border-secondary-100 bg-white text-secondary-500 hover:border-primary-200 hover:bg-primary-50',
        )}
      >
        Clasificación Global
      </button>
      <button
        type="button"
        role="tab"
        id="tab-teams"
        aria-selected={activeTab === 'teams'}
        aria-controls="panel-teams"
        onClick={() => onChange('teams')}
        className={cn(
          'min-h-11 cursor-pointer rounded-xl px-5 text-sm font-semibold transition-colors',
          'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
          activeTab === 'teams'
            ? 'bg-primary-500 text-white shadow-sm'
            : 'border border-secondary-100 bg-white text-secondary-500 hover:border-primary-200 hover:bg-primary-50',
        )}
      >
        Clasificación por Equipos
      </button>
    </div>
  );
}
