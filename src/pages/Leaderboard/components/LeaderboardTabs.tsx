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
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
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
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          activeTab === 'global'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'border border-border bg-card text-foreground hover:bg-muted',
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
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          activeTab === 'teams'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'border border-border bg-card text-foreground hover:bg-muted',
        )}
      >
        Clasificación por Equipos
      </button>
    </div>
  );
}
