import { useState } from 'react';
import { CampaignDetailDialog } from '@/components/campaigns/CampaignDetailDialog';
import { MockNotice } from '@/components/campaigns/MockNotice';
import { buildFallbackDetail } from '@/components/campaigns/fallback-detail';
import { useCampaigns } from '@/hooks/use-campaigns';
import type { Mission } from '@/types/mission';
import { ActiveMissionsSection } from './ActiveMissionsSection';
import { MyCampaignsSection } from './MyCampaignsSection';

// Stable reference: the hook only reads primitives, but a constant avoids re-creating it.
const PARTICIPATING = { participating: true } as const;

/**
 * Dashboard body for STUDENT/STAFF: their campaigns and active missions.
 */
export function StandardDashboard() {
  const campaignsData = useCampaigns(PARTICIPATING);
  const { campaigns, missions, progress, status, errorMessage, usingMock, reload } = campaignsData;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleLogAction(mission: Mission) {
    // TASK: conectar con el endpoint de registro de acciones cuando exista.
    console.info('Registrar acción (pendiente de endpoint):', mission.id, mission.action.name);
  }

  // With sample data on screen the sections are usable, so they are not shown as an error.
  const sectionsStatus = status === 'error' ? 'success' : status;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-8 pb-24">
      
      {usingMock ? <MockNotice errorMessage={errorMessage} onRetry={() => void reload()} /> : null}

      {/* TASK: reemplazar este placeholder por el componente de impacto del dashboard. */}
      <section
        aria-label="Dashboard Impact"
        className="flex min-h-48 items-center justify-center rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center dark:border-primary-700 dark:bg-primary-900/20"
      >
        <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
          Dashboard Impact
        </p>
      </section>

      <MyCampaignsSection
        campaigns={campaigns}
        status={sectionsStatus}
        errorMessage={errorMessage}
        onRetry={() => void reload()}
        onSelect={campaign => setSelectedId(campaign.id)}
      />
      <ActiveMissionsSection
        campaigns={campaigns}
        missions={missions}
        progress={progress}
        status={sectionsStatus}
        errorMessage={errorMessage}
        onRetry={() => void reload()}
        onLogAction={handleLogAction}
      />

      <CampaignDetailDialog
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void reload()}
        onLogAction={handleLogAction}
        fallback={usingMock ? buildFallbackDetail(selectedId, campaignsData) : null}
      />
    </div>
  );
}
