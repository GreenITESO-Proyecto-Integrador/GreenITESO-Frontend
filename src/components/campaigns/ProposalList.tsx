import { useState } from 'react';
import { CalendarRange, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APPROVAL_META, formatDate, formatDateRange } from '@/lib/campaign-meta';
import type { CampaignApprovalStatus } from '@/types/campaign';
import type { CampaignProposal } from '@/types/campaign-proposal';
import { usePagedItems } from '@/hooks/use-paged-items';
import { cn } from '@/lib/utils';
import { REJECTION_REASON_MAX_LENGTH, WRAP_TEXT } from './field-limits';
import { CharCounter } from './CharCounter';
import { FilterChips } from '@/components/shared/FilterChips';
import { Pagination } from '@/components/shared/Pagination';
import { SectionState } from '@/components/shared/SectionState';

export type ProposalFilter = CampaignApprovalStatus | 'ALL';

const FILTER_OPTIONS: readonly { value: ProposalFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
];

interface ProposalListProps {
  proposals: CampaignProposal[];
  status: 'loading' | 'success' | 'error';
  /** True while a filter change reloads in place; the current list is dimmed, not replaced. */
  refreshing?: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  /** Admin gets approve/reject; a user gets a read-only view of their own proposals. */
  isAdmin: boolean;
  filter: ProposalFilter;
  onFilterChange: (filter: ProposalFilter) => void;
  busyId: string | null;
  decisionError: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

interface ProposalCardProps {
  proposal: CampaignProposal;
  isAdmin: boolean;
  busy: boolean;
  disabled: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

function ProposalCard({
  proposal,
  isAdmin,
  busy,
  disabled,
  onApprove,
  onReject,
}: ProposalCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const approvalMeta = APPROVAL_META[proposal.approvalStatus];
  const controlsDisabled = busy || disabled;
  const canDecide = isAdmin && proposal.approvalStatus === 'PENDING';

  return (
    // `h-full` + `flex-1` content: cards in the same row stretch to equal height.
    <Card className="h-full rounded-2xl bg-card py-0 shadow-sm ring-1 ring-border">
      <CardHeader className="gap-3 p-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Propuesta
            </p>
            <CardTitle
              className={`line-clamp-2 text-lg font-semibold text-foreground ${WRAP_TEXT}`}
              title={proposal.title}
            >
              {proposal.title}
            </CardTitle>
          </div>
          <Badge variant="outline" className={approvalMeta.className}>
            {approvalMeta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <p
          className={`line-clamp-3 text-sm text-muted-foreground sm:text-base ${WRAP_TEXT}`}
          title={proposal.description}
        >
          {proposal.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarRange className="size-4" />
            {formatDateRange(proposal.startDate, proposal.endDate)}
          </span>
          <span className="tabular-nums">
            {proposal.missionsTotal} {proposal.missionsTotal === 1 ? 'misión' : 'misiones'}
          </span>
          {isAdmin && proposal.creatorId ? (
            <span className="break-all">Proponente: {proposal.creatorId}</span>
          ) : null}
        </div>

        {proposal.approvalStatus === 'REJECTED' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <p className="text-xs font-semibold tracking-wider uppercase">Motivo del rechazo</p>
            <p
              className={`mt-1 line-clamp-4 ${WRAP_TEXT}`}
              title={proposal.rejectionReason || undefined}
            >
              {proposal.rejectionReason || 'Sin motivo indicado.'}
            </p>
          </div>
        ) : null}

        {proposal.reviewedAt ? (
          <p className="mt-auto text-xs text-muted-foreground">
            Revisada el {formatDate(proposal.reviewedAt)}
          </p>
        ) : null}

        {canDecide ? (
          rejecting ? (
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`proposal-reason-${proposal.id}`}>Motivo del rechazo</Label>
                <Textarea
                  id={`proposal-reason-${proposal.id}`}
                  value={reason}
                  maxLength={REJECTION_REASON_MAX_LENGTH}
                  disabled={controlsDisabled}
                  placeholder="Obligatorio al rechazar"
                  onChange={event => setReason(event.target.value)}
                  className={`max-h-40 min-h-20 resize-none overflow-y-auto rounded-xl ${WRAP_TEXT}`}
                />
                <CharCounter value={reason} max={REJECTION_REASON_MAX_LENGTH} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={controlsDisabled || !reason.trim()}
                  onClick={() => onReject(proposal.id, reason)}
                  className="min-h-11 cursor-pointer rounded-xl border-red-200 bg-red-50 px-5 font-semibold text-red-700 hover:bg-red-50"
                >
                  Confirmar rechazo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={controlsDisabled}
                  onClick={() => {
                    setRejecting(false);
                    setReason('');
                  }}
                  className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                disabled={controlsDisabled}
                onClick={() => onApprove(proposal.id)}
                className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
              >
                Aprobar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={controlsDisabled}
                onClick={() => setRejecting(true)}
                className="min-h-11 cursor-pointer rounded-xl border-red-200 bg-red-50 px-5 font-semibold text-red-700 hover:bg-red-50"
              >
                Rechazar
              </Button>
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Proposals with an approval filter. Admin can approve/reject; users see their own read-only.
 */
export function ProposalList({
  proposals,
  status,
  refreshing = false,
  errorMessage,
  onRetry,
  isAdmin,
  filter,
  onFilterChange,
  busyId,
  decisionError,
  onApprove,
  onReject,
}: ProposalListProps) {
  const { page, totalPages, pageItems, setPage } = usePagedItems(proposals);

  return (
    <div className="flex flex-col gap-4">
      <FilterChips
        label="Filtrar propuestas por estado"
        options={FILTER_OPTIONS}
        value={filter}
        onChange={next => {
          setPage(1);
          onFilterChange(next);
        }}
      />

      {decisionError ? (
        <p className="text-sm text-red-700" role="alert">
          {decisionError}
        </p>
      ) : null}

      <SectionState
        status={status}
        errorMessage={errorMessage}
        onRetry={onRetry}
        isEmpty={proposals.length === 0}
        loadingText="Cargando propuestas…"
        errorTitle="No se pudieron cargar las propuestas"
        emptyIcon={ClipboardList}
        emptyTitle={isAdmin ? 'No hay propuestas' : 'Aún no has propuesto campañas'}
        emptyText={
          isAdmin
            ? 'Cuando alguien proponga una campaña, aparecerá aquí para aprobar o rechazar.'
            : 'Usa "Proponer campaña" para enviar una idea a los administradores.'
        }
      >
        <div
          aria-busy={refreshing}
          className={cn(
            'flex flex-col gap-5 transition-opacity duration-200',
            refreshing && 'pointer-events-none opacity-60',
          )}
        >
          <ul
            key={`${filter}-${page}`}
            className="grid animate-fade-in grid-cols-1 gap-4 motion-reduce:animate-none lg:grid-cols-2"
          >
            {pageItems.map(proposal => (
              <li key={proposal.id}>
                <ProposalCard
                  proposal={proposal}
                  isAdmin={isAdmin}
                  busy={busyId === proposal.id}
                  disabled={busyId !== null}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            label="propuestas"
          />
        </div>
      </SectionState>
    </div>
  );
}
