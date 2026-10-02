import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { CampaignDetailDialog } from '@/components/campaigns/CampaignDetailDialog';
import { SectionState } from '@/components/shared/SectionState';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useEcologicalProfile } from '@/hooks/use-ecological-profile';
import type { Mission } from '@/types/mission';
import { ActiveMissionsSection } from './ActiveMissionsSection';
import { ImpactMetrics } from './ImpactMetrics';
import { MyCampaignsSection } from './MyCampaignsSection';

// Stable reference: the hook only reads primitives, but a constant avoids re-creating it.
const PARTICIPATING = { participating: true } as const;

/**
 * Dashboard body for STUDENT/STAFF: their campaigns and active missions.
 */
export function UserDashboard() {
  const { campaigns, missions, progress, status, errorMessage, reload } =
    useCampaigns(PARTICIPATING);
  const {
    profile,
    status: profileStatus,
    errorMessage: profileErrorMessage,
    reload: reloadProfile,
  } = useEcologicalProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleLogAction(mission: Mission) {
    // TASK: conectar con el endpoint de registro de acciones cuando exista.
    console.info('Registrar acción (pendiente de endpoint):', mission.id, mission.action.name);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-8 pb-24">
      <SectionState
        status={profileStatus}
        errorMessage={profileErrorMessage}
        onRetry={() => void reloadProfile()}
        isEmpty={false}
        loadingText="Cargando tu impacto…"
        errorTitle="No se pudo cargar tu impacto"
        emptyIcon={BarChart3}
        emptyTitle=""
        emptyText=""
      >
        {profile ? <ImpactMetrics profile={profile} /> : null}
      </SectionState>

      <MyCampaignsSection
        campaigns={campaigns}
        status={status}
        errorMessage={errorMessage}
        onRetry={() => void reload()}
        onSelect={campaign => setSelectedId(campaign.id)}
      />
      <ActiveMissionsSection
        campaigns={campaigns}
        missions={missions}
        progress={progress}
        status={status}
        errorMessage={errorMessage}
        onRetry={() => void reload()}
        onLogAction={handleLogAction}
      />

      <CampaignDetailDialog
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void reload()}
        onLogAction={handleLogAction}
      />
    </div>
  );
}
