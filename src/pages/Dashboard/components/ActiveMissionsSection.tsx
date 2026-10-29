import { Target } from 'lucide-react';
import { MissionItem } from '@/components/shared/MissionItem';
import { SectionState } from '@/components/shared/SectionState';
import type { Campaign } from '@/types/campaign';
import type { Mission, UserMissionProgress } from '@/types/mission';

interface ActiveMissionsSectionProps {
  campaigns: Campaign[];
  missions: Mission[];
  progress: Record<string, UserMissionProgress>;
  status: 'loading' | 'success' | 'error';
  errorMessage: string | null;
  onRetry: () => void;
  onLogAction: (mission: Mission) => void;
}

/**
 * Missions of the in-progress campaigns the user joined, grouped by campaign, with progress.
 */
export function ActiveMissionsSection({
  campaigns,
  missions,
  progress,
  status,
  errorMessage,
  onRetry,
  onLogAction,
}: ActiveMissionsSectionProps) {
  const activeGroups = campaigns
    .filter(campaign => campaign.status === 'IN_PROGRESS' && campaign.isParticipant)
    .map(campaign => ({
      campaign,
      missions: missions.filter(mission => mission.campaignId === campaign.id),
    }))
    .filter(group => group.missions.length > 0);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold text-foreground">Misiones activas</h2>
      <SectionState
        status={status}
        errorMessage={errorMessage}
        onRetry={onRetry}
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
                  onLogAction={onLogAction}
                />
              ))}
            </div>
          ))}
        </div>
      </SectionState>
    </section>
  );
}
