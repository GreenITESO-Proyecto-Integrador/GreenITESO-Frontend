import { useState } from 'react';
import { History, Leaf } from 'lucide-react';
import type { ActionLog, ActionLogStatus } from '@/types/action-logs';
import { useMyActionLogs } from '@/hooks/use-my-action-logs';
import { Badge } from '@/components/ui/badge';

type StatusFilter = ActionLogStatus | 'ALL';

const statusTranslations: Record<ActionLogStatus, string> = {
  APPROVED: 'Aprobado',
  PENDING_AUDIT: 'Pendiente',
  REJECTED: 'Rechazado',
};

// Same colors as APPROVAL_META in src/lib/campaign-meta.ts.
const statusClassNames: Record<ActionLogStatus, string> = {
  APPROVED:
    'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800',
  PENDING_AUDIT:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  REJECTED:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'PENDING_AUDIT', label: 'Pendientes' },
  { value: 'REJECTED', label: 'Rechazadas' },
];

const emptyMessages: Record<StatusFilter, string> = {
  ALL: 'Cuando registres una acción sostenible, aparecerá aquí con su estado.',
  APPROVED: 'Todavía no tienes acciones aprobadas.',
  PENDING_AUDIT: 'No tienes acciones pendientes de revisión.',
  REJECTED: 'No tienes acciones rechazadas.',
};

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function formatDate(value: string): string {
  const date = new Date(value);
  return isNaN(date.getTime()) ? 'Fecha no especificada' : dateFormatter.format(date);
}

/** The backend sends CO2 as a decimal string such as "1.250". */
function formatCo2(value: string): string | null {
  const kg = Number(value);
  if (!value || !Number.isFinite(kg) || kg <= 0) return null;
  return `${kg.toLocaleString('es-MX', { maximumFractionDigits: 3 })} kg CO₂`;
}

function ActionLogItem({ log }: { log: ActionLog }) {
  const co2 = formatCo2(log.co2KgFactorSnapshot);

  return (
    <li className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-700/50 dark:text-emerald-400">
          <Leaf className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">
            {log.action.name || 'Acción sin nombre'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.createdAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
          {log.pointsAwarded} pts
        </span>
        {co2 && (
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
            {co2}
          </span>
        )}
        <Badge variant="outline" className={statusClassNames[log.status]}>
          {statusTranslations[log.status]}
        </Badge>
      </div>
    </li>
  );
}

export function ActionHistorySection() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const { data, loading, error } = useMyActionLogs(
    selectedStatus === 'ALL' ? undefined : selectedStatus,
  );

  let content;
  if (loading) {
    content = (
      <div
        role="status"
        className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground border border-border shadow-xs"
      >
        Cargando historial...
      </div>
    );
  } else if (error) {
    content = (
      <div
        role="alert"
        className="bg-card rounded-2xl p-6 text-center text-sm text-destructive border border-border shadow-xs"
      >
        {error}
      </div>
    );
  } else if (!data || data.length === 0) {
    content = (
      <div className="bg-card rounded-2xl p-6 sm:p-8 text-center border border-border shadow-xs">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-800/50 dark:text-sky-400">
          <History className="size-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Sin registros de acciones</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {emptyMessages[selectedStatus]}
        </p>
      </div>
    );
  } else {
    content = (
      <ul className="bg-card rounded-2xl border border-border shadow-xs divide-y divide-border overflow-hidden">
        {data.map(log => (
          <ActionLogItem key={log.id} log={log} />
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="historial-acciones-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 id="historial-acciones-title" className="text-xl font-bold text-foreground">
          Historial de Acciones
        </h2>
        <select
          aria-label="Filtrar acciones por estado"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value as StatusFilter)}
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {filterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {content}
    </section>
  );
}
