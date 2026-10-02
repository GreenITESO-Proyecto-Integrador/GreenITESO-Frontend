import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuditQueue } from '@/hooks/use-audit-queue';
import { AuditLogList } from './components/AuditLogList';
import { parseAuditTab } from './components/audit-tab';
import { AuditTabs } from './components/AuditTabs';
import { ProposalsTab } from './components/ProposalsTab';

/**
 * Dashboard that lists PENDING_AUDIT evidence and lets staff approve or reject it.
 */
export function AuditReviewPage() {
  const { logs, status, errorMessage, decisionError, busyLogId, reload, approveLog, rejectLog } =
    useAuditQueue();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseAuditTab(searchParams.get('tab'));
  const showEvidence = tab === 'evidencias';

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Auditoría</p>
        <h1 className="text-2xl font-bold text-foreground">Panel de revisión</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Evidencias fotográficas en PENDING_AUDIT. Aprobar o rechazar no calcula puntos en el
          cliente.
        </p>
      </header>

      <AuditTabs value={tab} onChange={next => setSearchParams({ tab: next }, { replace: true })} />

      {tab === 'propuestas' ? <ProposalsTab /> : null}

      {showEvidence && status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Cargando cola de auditoría…
        </p>
      ) : null}

      {showEvidence && status === 'error' ? (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          <h2 className="text-lg font-semibold">No se pudo cargar la cola de auditoría</h2>
          <p className="mt-2 text-sm">
            No fue posible obtener las evidencias pendientes. Intenta de nuevo cuando el servicio
            esté disponible.
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

      {showEvidence && decisionError ? (
        <p className="text-sm text-destructive" role="alert">
          {decisionError}
        </p>
      ) : null}

      {showEvidence && status === 'success' ? (
        <AuditLogList
          logs={logs}
          busyLogId={busyLogId}
          disabled={busyLogId !== null}
          onApprove={logId => {
            void approveLog(logId);
          }}
          onReject={(logId, reason) => {
            void rejectLog(logId, reason);
          }}
        />
      ) : null}
    </div>
  );
}

export default AuditReviewPage;
