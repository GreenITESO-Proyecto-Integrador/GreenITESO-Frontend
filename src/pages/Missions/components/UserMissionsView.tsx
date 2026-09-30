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
} from '@/components/campaigns/campaign-filters';
import { CampaignDetailDialog } from '@/components/campaigns/CampaignDetailDialog';
import { CampaignFormDialog } from './CampaignFormDialog';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { FilterChips } from '@/components/shared/FilterChips';
import { ProposalList, type ProposalFilter } from '@/components/campaigns/ProposalList';
import { SectionState } from '@/components/shared/SectionState';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';

/**
 * Missions page for non-admin users: every campaign to join, plus their own proposals.
 * Their joined campaigns and active missions live in the Dashboard.
 */
export function UserMissionsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const { campaigns, status, errorMessage, reload } = useCampaigns({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    scope: scopeFilter === 'ALL' ? undefined : scopeFilter,
  });
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('ALL');
  const proposalsData = useCampaignProposals(proposalFilter === 'ALL' ? undefined : proposalFilter);
  const [createOpen, setCreateOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Misiones y campañas</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Participa en campañas activas y completa misiones para sumar puntos e impacto ambiental.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="min-h-11 shrink-0 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
        >
          <Plus className="size-4" />
          Crear campaña de clan
        </Button>
      </div>

      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

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
          status={status}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-foreground">Mis propuestas</h2>
          <Button
            type="button"
            onClick={() => setProposeOpen(true)}
            className="min-h-11 shrink-0 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            <Plus className="size-4" />
            Proponer campaña
          </Button>
        </div>
        <ProposalList
          proposals={proposalsData.proposals}
          status={proposalsData.status}
          refreshing={proposalsData.refreshing}
          errorMessage={proposalsData.errorMessage}
          onRetry={() => void proposalsData.reload()}
          isAdmin={false}
          filter={proposalFilter}
          onFilterChange={setProposalFilter}
          busyId={proposalsData.busyId}
          decisionError={proposalsData.decisionError}
          onApprove={() => undefined}
          onReject={() => undefined}
        />
      </section>

      <CampaignFormDialog
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        mode="propose"
        onSubmitted={() => {
          setNotice('¡Propuesta enviada! Un administrador la revisará pronto.');
          void proposalsData.reload();
        }}
      />
      <CampaignFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create-clan"
        onSubmitted={() => {
          setNotice('¡Campaña creada! Ya está disponible para tu clan.');
          void reload();
        }}
      />
      <CampaignDetailDialog
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void reload()}
      />
    </>
  );
}
