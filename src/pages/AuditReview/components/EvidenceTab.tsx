import { Button } from '@/components/ui/button';
import { useAuditQueue } from '@/hooks/use-audit-queue';
import { AuditLogList } from './AuditLogList';

/**
 * PENDING_AUDIT evidence queue: staff approve or reject each photo.
 */
export function EvidenceTab() {
  const { logs, status, errorMessage, decisionError, busyLogId, reload, approveLog, rejectLog } =
    useAuditQueue();

  return (
    <div>
      <p className="mb-6 text-sm text-secondary-300 sm:text-base">
        Evidencias fotográficas en PENDING_AUDIT. Aprobar o rechazar no calcula puntos en el
        cliente.
      </p>

      {status === 'loading' ? (
        <p className="text-sm text-secondary-300" role="status">
          Cargando cola de auditoría…
        </p>
      ) : null}

      {status === 'error' ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">No se pudo cargar la cola de auditoría</h2>
          <p className="mt-2 text-sm">
            No fue posible obtener las evidencias pendientes. Intenta de nuevo cuando el servicio
            esté disponible.
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

      {decisionError ? (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {decisionError}
        </p>
      ) : null}

      {status === 'success' ? (
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
