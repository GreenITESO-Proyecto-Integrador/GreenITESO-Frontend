import { useCallback, useState } from 'react';
import { Megaphone, Plus, Target } from 'lucide-react';
import { MissionItem } from '@/components/shared/MissionItem';
import { Button } from '@/components/ui/button';
import { useCampaignProposals } from '@/hooks/use-campaign-proposals';
import { useCampaigns } from '@/hooks/use-campaigns';
import type { Mission } from '@/types/mission';
import {
  SCOPE_OPTIONS,
  STATUS_OPTIONS,
  type ScopeFilter,
  type StatusFilter,
} from '@/components/campaigns/campaign-filters';
import { buildFallbackDetail } from '@/components/campaigns/fallback-detail';
import { CampaignDetailDialog } from '@/components/campaigns/CampaignDetailDialog';
import { CampaignFormDialog } from './CampaignFormDialog';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { FilterChips } from '@/components/shared/FilterChips';
import { MockNotice } from '@/components/campaigns/MockNotice';
import { ProposalList, type ProposalFilter } from '@/components/campaigns/ProposalList';
import { SectionState } from '@/components/shared/SectionState';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';

// Stable reference: the hook only reads primitives, but a constant avoids re-creating it.
const PARTICIPATING = { participating: true } as const;

/**
 * Missions page for non-admin users: their campaigns, active missions and proposals.
 */
export function UserMissionsView() {
  const campaignsData = useCampaigns(PARTICIPATING);
  const { campaigns, missions, progress, status, errorMessage, usingMock, reload } = campaignsData;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('ALL');
  const proposalsData = useCampaignProposals(proposalFilter === 'ALL' ? undefined : proposalFilter);
  const [createOpen, setCreateOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Filters only narrow the campaign cards; "Misiones activas" keeps using every campaign.
  const visibleCampaigns = campaigns.filter(
    campaign =>
      (statusFilter === 'ALL' || campaign.status === statusFilter) &&
      (scopeFilter === 'ALL' || campaign.scope === scopeFilter),
  );

  const activeGroups = campaigns
    .filter(campaign => campaign.status === 'IN_PROGRESS' && campaign.isParticipant)
    .map(campaign => ({
      campaign,
      missions: missions.filter(mission => mission.campaignId === campaign.id),
    }))
    .filter(group => group.missions.length > 0);

  function handleLogAction(mission: Mission) {
    // TASK: conectar con el endpoint de registro de acciones cuando exista.
    console.info('Registrar acción (pendiente de endpoint):', mission.id, mission.action.name);
  }

  // With sample data on screen the section is usable, so it is not shown as an error.
  const campaignsStatus = status === 'error' ? 'success' : status;

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
          Crear campaña
        </Button>
      </div>

      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

      {usingMock ? <MockNotice errorMessage={errorMessage} onRetry={() => void reload()} /> : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground">Mis campañas</h2>
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
          isEmpty={visibleCampaigns.length === 0}
          loadingText="Cargando campañas…"
          errorTitle="No se pudieron cargar tus campañas"
          emptyIcon={Megaphone}
          emptyTitle={
            campaigns.length === 0
              ? 'Aún no participas en campañas'
              : 'Ninguna campaña coincide con los filtros'
          }
          emptyText={
            campaigns.length === 0
              ? 'Cuando te inscribas a una campaña, aparecerá aquí.'
              : 'Prueba con otro estado o alcance.'
          }
        >
          <CampaignGrid
            key={`${statusFilter}-${scopeFilter}`}
            campaigns={visibleCampaigns}
            onSelect={c => setSelectedId(c.id)}
          />
        </SectionState>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-foreground">Misiones activas</h2>
        <SectionState
          status={campaignsStatus}
          errorMessage={errorMessage}
          onRetry={() => void reload()}
          isEmpty={activeGroups.length === 0}
          loadingText="Cargando misiones…"
          errorTitle="No se pudieron cargar tus misiones"
          emptyIcon={Target}
          emptyTitle="No tienes misiones activas"
          emptyText="Las misiones de tus campañas activas aparecerán aquí."
        >
          <div className="flex flex-col gap-5">
            {activeGroups.map(group => (
              <div key={group.campaign.id} className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{group.campaign.title}</h3>
                {group.missions.map(mission => (
                  <MissionItem
                    key={mission.id}
                    mission={mission}
                    userProgress={progress[mission.id]}
                    onLogAction={handleLogAction}
                  />
                ))}
              </div>
            ))}
          </div>
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
        onLogAction={handleLogAction}
        fallback={usingMock ? buildFallbackDetail(selectedId, campaignsData) : null}
      />
    </>
  );
}
