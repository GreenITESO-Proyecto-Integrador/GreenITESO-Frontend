import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import {
  SCOPE_OPTIONS,
  STATUS_OPTIONS,
  type ScopeFilter,
  type StatusFilter,
} from '@/components/campaigns/campaign-filters';
import { FilterChips } from '@/components/shared/FilterChips';
import { SectionState } from '@/components/shared/SectionState';
import type { Campaign } from '@/types/campaign';

interface MyCampaignsSectionProps {
  campaigns: Campaign[];
  status: 'loading' | 'success' | 'error';
  errorMessage: string | null;
  onRetry: () => void;
  onSelect: (campaign: Campaign) => void;
}

/**
 * Campaigns the user takes part in, with status/scope filters and pagination.
 */
export function MyCampaignsSection({
  campaigns,
  status,
  errorMessage,
  onRetry,
  onSelect,
}: MyCampaignsSectionProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');

  // Filters only narrow the campaign cards; "Misiones activas" keeps using every campaign.
  const visibleCampaigns = campaigns.filter(
    campaign =>
      (statusFilter === 'ALL' || campaign.status === statusFilter) &&
      (scopeFilter === 'ALL' || campaign.scope === scopeFilter),
  );

  return (
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
        status={status}
        errorMessage={errorMessage}
        onRetry={onRetry}
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
          onSelect={onSelect}
        />
      </SectionState>
      {status === 'success' && campaigns.length === 0 ? (
        <Link
          to="/missions"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
        >
          Unirme a una campaña
        </Link>
      ) : null}
    </section>
  );
}
