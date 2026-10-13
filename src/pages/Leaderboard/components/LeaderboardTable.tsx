import { Trophy } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardTab } from '@/types/leaderboard';
import { isClanLeaderboardTab } from '@/types/leaderboard';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  tab: LeaderboardTab;
}

/**
 * Ranked table of display names and denormalized point totals for the current page.
 */
export function LeaderboardTable({ entries, tab }: LeaderboardTableProps) {
  const isClanTab = isClanLeaderboardTab(tab);
  const nameHeading = isClanTab ? 'Equipo' : 'Participante';

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center dark:border-sky-800 dark:bg-sky-900/30">
        <Trophy className="mx-auto mb-4 size-10 text-sky-700 dark:text-sky-300" />
        <h2 className="text-lg font-semibold text-sky-800 dark:text-sky-200">
          Aún no hay clasificación
        </h2>
        <p className="mt-2 text-sm text-sky-700 dark:text-sky-300">
          Cuando el motor de puntos publique totales, la tabla se llenará aquí.
        </p>
      </section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[320px] text-left">
        <caption className="sr-only">
          {tab === 'institutional'
            ? 'Ranking institucional'
            : tab === 'private_clan'
              ? 'Ranking de clanes privados'
              : 'Clasificación global'}
        </caption>
        <thead>
          <tr className="border-b border-border bg-primary-50 text-xs font-semibold tracking-wider text-secondary-400 uppercase dark:bg-primary-900/40 dark:text-primary-200">
            <th className="px-4 py-3">Pos.</th>
            <th className="px-4 py-3">{nameHeading}</th>
            <th className="px-4 py-3 text-right">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr
              key={entry.id}
              className="border-b border-border last:border-b-0 hover:bg-primary-50 dark:hover:bg-primary-900/30"
            >
              <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">
                {entry.rank}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-foreground">
                {entry.displayName}
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold text-primary-600 tabular-nums dark:text-primary-400">
                {entry.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
