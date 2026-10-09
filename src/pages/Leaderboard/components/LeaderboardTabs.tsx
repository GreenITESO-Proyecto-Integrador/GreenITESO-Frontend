import { cn } from '@/lib/utils';
import type { LeaderboardTab } from '@/types/leaderboard';

interface LeaderboardTabsProps {
  activeTab: LeaderboardTab;
  onChange: (tab: LeaderboardTab) => void;
}

const TABS: { id: LeaderboardTab; label: string }[] = [
  { id: 'global', label: 'Clasificación Global' },
  { id: 'institutional', label: 'Ranking institucional' },
  { id: 'private_clan', label: 'Clanes privados' },
];

/**
 * Switch between user ranking and the two clan ranking types from the rankings API.
 */
export function LeaderboardTabs({ activeTab, onChange }: LeaderboardTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Tablas de clasificación"
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={cn(
            'min-h-11 cursor-pointer rounded-xl px-5 text-sm font-semibold transition-colors',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
            activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-sm'
              : 'border border-secondary-100 bg-white text-secondary-500 hover:border-primary-200 hover:bg-primary-50',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
