import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { CampaignDetailDialog } from '@/components/campaigns/CampaignDetailDialog';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { SectionState } from '@/components/shared/SectionState';
import { useCampaigns } from '@/hooks/use-campaigns';

interface ClanActiveCampaignsProps {
  clanId: string;
}

/**
 * The clan's own campaigns that are running now. Only members see them (the backend answers an
 * empty list to anyone else), so the clan page mounts this for members only.
 */
export function ClanActiveCampaigns({ clanId }: ClanActiveCampaignsProps) {
  const { campaigns, status, errorMessage, reload } = useCampaigns({
    targetClanId: clanId,
    isActive: true,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <section aria-labelledby="clan-campaigns-title" className="flex flex-col gap-4">
      <h2 id="clan-campaigns-title" className="text-xl font-bold text-foreground">
        Campañas activas
      </h2>
      <SectionState
        status={status}
        errorMessage={errorMessage}
        onRetry={() => void reload()}
        isEmpty={campaigns.length === 0}
        loadingText="Cargando campañas del clan…"
        errorTitle="No se pudieron cargar las campañas del clan"
        emptyIcon={Megaphone}
        emptyTitle="Sin campañas activas"
        emptyText="Cuando se cree una campaña para este clan y esté en curso, aparecerá aquí."
      >
        <CampaignGrid campaigns={campaigns} onSelect={campaign => setSelectedId(campaign.id)} />
      </SectionState>

      <CampaignDetailDialog
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void reload()}
      />
    </section>
  );
}
