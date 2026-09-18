import { ClipboardList } from 'lucide-react';
import type { PendingAuditLog } from '@/types/action-audit';
import { AuditLogCard } from './AuditLogCard';

interface AuditLogListProps {
  logs: PendingAuditLog[];
  busyLogId: string | null;
  disabled: boolean;
  onApprove: (logId: string) => void;
  onReject: (logId: string, reason: string) => void;
}

/**
 * List of pending audit cards for the review dashboard.
 */
export function AuditLogList({
  logs,
  busyLogId,
  disabled,
  onApprove,
  onReject,
}: AuditLogListProps) {
  if (logs.length === 0) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center">
        <ClipboardList className="mx-auto mb-4 size-10 text-sky-700" />
        <h2 className="text-lg font-semibold text-sky-800">No hay evidencias pendientes</h2>
        <p className="mt-2 text-sm text-sky-700">
          Cuando haya registros en PENDING_AUDIT, aparecerán aquí para aprobar o rechazar.
        </p>
      </section>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {logs.map(log => (
        <li key={log.id}>
          <AuditLogCard
            log={log}
            busy={busyLogId === log.id}
            disabled={disabled}
            onApprove={onApprove}
            onReject={onReject}
          />
        </li>
      ))}
    </ul>
  );
}
