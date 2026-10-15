import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PendingAuditLog } from '@/types/action-audit';
import { AuditEvidencePreview } from './AuditEvidencePreview';

interface AuditLogCardProps {
  log: PendingAuditLog;
  busy: boolean;
  disabled: boolean;
  onApprove: (logId: string) => void;
  onReject: (logId: string, reason: string) => void;
}

/**
 * Format a backend timestamp for the audit queue card.
 */
function formatCreatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || 'Sin fecha';
  }
  return parsed.toLocaleString('es-MX');
}

/**
 * Card for one PENDING_AUDIT evidence item with approve and reject actions.
 */
export function AuditLogCard({ log, busy, disabled, onApprove, onReject }: AuditLogCardProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const actionLabel = log.action.name || log.action.code || 'Acción sin nombre';
  const controlsDisabled = busy || disabled;

  return (
    <Card className="rounded-2xl bg-card py-0 shadow-sm ring-1 ring-border">
      <CardHeader className="gap-3 p-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Evidencia
            </p>
            <CardTitle className="text-lg font-semibold text-foreground">{actionLabel}</CardTitle>
          </div>
          <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wider text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            PENDIENTE
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Usuario</dt>
            <dd className="font-medium break-all text-foreground">{log.user.id || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Puntos</dt>
            <dd className="font-bold text-primary-700 tabular-nums dark:text-primary-300">
              {log.pointsAwarded} pts
            </dd>
          </div>
          <AuditEvidencePreview
            evidenceUrl={log.evidenceUrl}
            evidenceObjectKey={log.evidenceObjectKey}
            actionName={actionLabel}
          />
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Registrado</dt>
            <dd className="text-muted-foreground">{formatCreatedAt(log.createdAt)}</dd>
          </div>
        </dl>

        <div>
          <label
            htmlFor={`rejection-reason-${log.id}`}
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Motivo del rechazo
          </label>
          <Input
            id={`rejection-reason-${log.id}`}
            value={rejectionReason}
            disabled={controlsDisabled}
            placeholder="Obligatorio al rechazar"
            onChange={event => setRejectionReason(event.target.value)}
            className="h-11 min-h-11 rounded-xl border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            disabled={controlsDisabled}
            onClick={() => onApprove(log.id)}
            className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            Aprobar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={controlsDisabled}
            onClick={() => onReject(log.id, rejectionReason)}
            className="min-h-11 cursor-pointer rounded-xl border-red-200 bg-red-50 px-5 font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
          >
            Rechazar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
