import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import type { LeaderboardTab } from '@/types/leaderboard';
import { LeaderboardTable } from './components/LeaderboardTable';
import { LeaderboardTabs } from './components/LeaderboardTabs';

/**
 * Leaderboard screen with global and team ranking tabs.
 */
export function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderboardTab>('global');
  const { entries, status, errorMessage, reload } = useLeaderboard(tab);
  const panelId = tab === 'teams' ? 'panel-teams' : 'panel-global';
  const tabId = tab === 'teams' ? 'tab-teams' : 'tab-global';

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Rankings</p>
        <h1 className="text-2xl font-bold text-foreground">Tablas de clasificación</h1>
      </header>

      <div className="flex flex-col gap-4">
        <LeaderboardTabs activeTab={tab} onChange={setTab} />

        <section role="tabpanel" id={panelId} aria-labelledby={tabId}>
          {status === 'loading' ? (
            <p className="text-sm text-muted-foreground" role="status">
              Cargando clasificación…
            </p>
          ) : null}

          {status === 'error' ? (
            <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
              <h2 className="text-lg font-semibold">No se pudo cargar la clasificación</h2>
              <p className="mt-2 text-sm">
                No fue posible obtener el ranking. Intenta de nuevo cuando el servicio esté
                disponible.
              </p>
              {errorMessage ? <p className="mt-2 text-xs">{errorMessage}</p> : null}
              <Button
                type="button"
                onClick={() => {
                  void reload();
                }}
                className="mt-4 min-h-11"
              >
                Reintentar
              </Button>
            </section>
          ) : null}

          {status === 'success' ? <LeaderboardTable entries={entries} tab={tab} /> : null}
        </section>
      </div>
    </div>
  );
}

export default LeaderboardPage;
