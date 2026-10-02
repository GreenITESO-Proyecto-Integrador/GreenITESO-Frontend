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
      <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <Trophy className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Aún no hay clasificación</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuando el motor de puntos publique totales, la tabla se llenará aquí.
        </p>
      </section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-card shadow-sm ring-1 ring-border">
      <table className="w-full min-w-[320px] text-left">
        <caption className="sr-only">
          {tab === 'teams' ? 'Clasificación por equipos' : 'Clasificación global'}
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <th className="px-4 py-3">Pos.</th>
            <th className="px-4 py-3">{nameHeading}</th>
            <th className="px-4 py-3 text-right">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} className="border-b border-border last:border-b-0 hover:bg-muted/60">
              <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">
                {entry.rank}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-foreground">
                {entry.displayName}
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold text-primary tabular-nums">
                {entry.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
