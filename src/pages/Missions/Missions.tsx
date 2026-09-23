import { CampaignCard } from '@/components/shared/CampaignCard';
import { MissionItem } from '@/components/shared/MissionItem';
import { mockCampaigns, mockMissions, mockUserProgress } from '@/pages/Missions/mock-data';

export function MissionsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Misiones y campañas</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Participa en campañas activas y completa misiones para sumar puntos e impacto ambiental.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground">Campañas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onSelect={selected => console.log('Campaña seleccionada:', selected.id)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-foreground">Misiones activas</h2>
        <div className="flex flex-col gap-2">
          {mockMissions.map(mission => (
            <MissionItem
              key={mission.id}
              mission={mission}
              userProgress={mockUserProgress[mission.id]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default MissionsPage;
