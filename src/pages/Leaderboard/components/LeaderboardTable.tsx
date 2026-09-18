import { Trophy } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardTab } from '@/types/leaderboard';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  tab: LeaderboardTab;
}

/**
 * Ranked table of display names and denormalized point totals.
 */
export function LeaderboardTable({ entries, tab }: LeaderboardTableProps) {
  const nameHeading = tab === 'teams' ? 'Equipo' : 'Participante';

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center">
        <Trophy className="mx-auto mb-4 size-10 text-sky-700" />
        <h2 className="text-lg font-semibold text-sky-800">Aún no hay clasificación</h2>
        <p className="mt-2 text-sm text-sky-700">
          Cuando el motor de puntos publique totales, la tabla se llenará aquí.
        </p>
      </section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-secondary-100 bg-white shadow-sm">
      <table className="w-full min-w-[320px] text-left">
        <caption className="sr-only">
          {tab === 'teams' ? 'Clasificación por equipos' : 'Clasificación global'}
        </caption>
        <thead>
          <tr className="border-b border-secondary-100 bg-primary-50 text-xs font-semibold tracking-wider text-secondary-400 uppercase">
            <th className="px-4 py-3">Pos.</th>
            <th className="px-4 py-3">{nameHeading}</th>
            <th className="px-4 py-3 text-right">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr
              key={entry.id}
              className="border-b border-secondary-100 last:border-b-0 hover:bg-primary-50"
            >
              <td className="px-4 py-3 text-sm font-bold text-secondary-500 tabular-nums">
                {entry.rank}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-secondary-500">
                {entry.displayName}
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold text-primary-600 tabular-nums">
                {entry.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
