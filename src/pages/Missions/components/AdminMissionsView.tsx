import { useCallback, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCampaignProposals } from '@/hooks/use-campaign-proposals';
import { useCampaigns } from '@/hooks/use-campaigns';
import {
  SCOPE_OPTIONS,
  STATUS_OPTIONS,
  type ScopeFilter,
  type StatusFilter,
} from '../campaign-filters';
import { buildFallbackDetail } from '../fallback-detail';
import { CampaignDetailDialog } from './CampaignDetailDialog';
import { CampaignFormDialog } from './CampaignFormDialog';
import { CampaignGrid } from './CampaignGrid';
import { FilterChips } from './FilterChips';
import { MockNotice } from './MockNotice';
import { ProposalList, type ProposalFilter } from './ProposalList';
import { SectionState } from './SectionState';
import { SuccessBanner } from './SuccessBanner';

/**
 * Missions page for ADMIN: every campaign with filters, plus the proposals audit.
 */
export function AdminMissionsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('PENDING');
  const campaignsData = useCampaigns({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    scope: scopeFilter === 'ALL' ? undefined : scopeFilter,
  });
  const { campaigns, status, errorMessage, usingMock, reload } = campaignsData;
  const proposalsData = useCampaignProposals(proposalFilter === 'ALL' ? undefined : proposalFilter);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  async function handleApprove(id: string) {
    // An approved proposal becomes a campaign, so the campaign list changes too.
    if (await proposalsData.approve(id)) {
      setNotice('Propuesta aprobada. Ya es una campaña disponible para la comunidad.');
      void reload();
    }
  }

  async function handleReject(id: string, reason: string) {
    if (await proposalsData.reject(id, reason)) {
      setNotice('Propuesta rechazada. El motivo quedó visible para quien la envió.');
    }
  }

  // With sample data on screen the section is usable, so it is not shown as an error.
  const campaignsStatus = status === 'error' ? 'success' : status;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Misiones y campañas</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Administra las campañas y revisa las propuestas de la comunidad.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setFormOpen(true)}
          className="min-h-11 shrink-0 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
        >
          <Plus className="size-4" />
          Crear campaña
        </Button>
      </div>

      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

      {usingMock ? <MockNotice errorMessage={errorMessage} onRetry={() => void reload()} /> : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground">Todas las campañas</h2>
        <div className="flex flex-col gap-3">
          <FilterChips
            label="Filtrar campañas por estado"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterChips
            label="Filtrar campañas por alcance"
            options={SCOPE_OPTIONS}
            value={scopeFilter}
            onChange={setScopeFilter}
          />
        </div>
        <SectionState
          status={campaignsStatus}
          errorMessage={errorMessage}
          onRetry={() => void reload()}
          isEmpty={campaigns.length === 0}
          loadingText="Cargando campañas…"
          errorTitle="No se pudieron cargar las campañas"
          emptyIcon={Megaphone}
          emptyTitle="No hay campañas"
          emptyText="No se encontraron campañas con los filtros seleccionados."
        >
          <CampaignGrid
            key={`${statusFilter}-${scopeFilter}`}
            campaigns={campaigns}
            onSelect={c => setSelectedId(c.id)}
          />
        </SectionState>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground">Auditoría de campañas propuestas</h2>
        <ProposalList
          proposals={proposalsData.proposals}
          status={proposalsData.status}
          refreshing={proposalsData.refreshing}
          errorMessage={proposalsData.errorMessage}
          onRetry={() => void proposalsData.reload()}
          isAdmin
          filter={proposalFilter}
          onFilterChange={setProposalFilter}
          busyId={proposalsData.busyId}
          decisionError={proposalsData.decisionError}
          onApprove={id => void handleApprove(id)}
          onReject={(id, reason) => void handleReject(id, reason)}
        />
      </section>

      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create-admin"
        onSubmitted={() => {
          setNotice('¡Campaña creada! Ya está disponible para la comunidad.');
          void reload();
        }}
      />
      <CampaignDetailDialog
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void reload()}
        fallback={usingMock ? buildFallbackDetail(selectedId, campaignsData) : null}
      />
    </>
  );
}
