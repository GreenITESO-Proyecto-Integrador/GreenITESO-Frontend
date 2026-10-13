import { useCallback, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { SectionState } from '@/components/shared/SectionState';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';

/**
 * Missions page for ADMIN: every campaign with filters, creation and PROMOTION editing.
 * The proposals audit lives in /audit.
 */
export function AdminMissionsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const { campaigns, status, errorMessage, reload } = useCampaigns({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    scope: scopeFilter === 'ALL' ? undefined : scopeFilter,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Misiones y campañas</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Administra las campañas de la comunidad. Las propuestas se revisan en Auditoría.
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
      />
    </>
  );
}
