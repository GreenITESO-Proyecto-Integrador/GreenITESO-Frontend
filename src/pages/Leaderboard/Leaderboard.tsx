import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { LeaderboardTable } from './components/LeaderboardTable';
import { LeaderboardTabs } from './components/LeaderboardTabs';

/**
 * Leaderboard screen with user and clan ranking tabs, paged from the backend.
 */
export function LeaderboardPage() {
  const { tab, setTab, entries, page, totalPages, setPage, status, errorMessage, reload } =
    useLeaderboard();
  const panelId = `panel-${tab}`;
  const tabId = `tab-${tab}`;

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

          {status === 'success' ? (
            <div className="flex flex-col gap-4">
              <LeaderboardTable entries={entries} tab={tab} />
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label="clasificación"
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default LeaderboardPage;
