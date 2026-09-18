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
    <main className="min-h-screen bg-secondary-50 px-4 pt-8 pb-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase">
            Rankings
          </p>
          <h1 className="text-2xl font-bold text-secondary-500">Tablas de clasificación</h1>
        </header>

        <LeaderboardTabs activeTab={tab} onChange={setTab} />

        <section role="tabpanel" id={panelId} aria-labelledby={tabId} className="rounded-2xl">
          {status === 'loading' ? (
            <p className="text-sm text-secondary-300" role="status">
              Cargando clasificación…
            </p>
          ) : null}

          {status === 'error' ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              <h2 className="text-lg font-semibold">No se pudo cargar la clasificación</h2>
              <p className="mt-2 text-sm">
                No fue posible obtener el ranking. Intenta de nuevo cuando el servicio esté
                disponible.
              </p>
              {errorMessage ? <p className="mt-2 text-xs text-red-600">{errorMessage}</p> : null}
              <Button
                type="button"
                onClick={() => {
                  void reload();
                }}
                className="mt-4 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
              >
                Reintentar
              </Button>
            </section>
          ) : null}

          {status === 'success' ? <LeaderboardTable entries={entries} tab={tab} /> : null}
        </section>
      </div>
    </main>
  );
}

export default LeaderboardPage;
