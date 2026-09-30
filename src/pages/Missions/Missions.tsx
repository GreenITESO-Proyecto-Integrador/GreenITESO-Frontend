import { CampaignCard } from '@/components/shared/CampaignCard';
import { MissionItem } from '@/components/shared/MissionItem';
import { useCampaigns } from '@/hooks/use-campaigns';

export function MissionsPage() {
  const { campaigns, missions, progress, status, errorMessage, usingMock, reload } =
    useCampaigns();
  const activeCampaignIds = new Set(
    campaigns.filter(campaign => campaign.status === 'ACTIVE').map(campaign => campaign.id),
  );
  const activeMissions = usingMock
    ? missions
    : missions.filter(mission => activeCampaignIds.has(mission.campaignId));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Misiones y campañas</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Participa en campañas activas y completa misiones para sumar puntos e impacto ambiental.
        </p>
      </div>

      {usingMock ? (
        <p className="text-sm text-muted-foreground">
          No se pudo conectar con el servidor ({errorMessage}). Mostrando datos de ejemplo.{' '}
          <button type="button" className="underline" onClick={() => void reload()}>
            Reintentar
          </button>
        </p>
      ) : null}
      {status === 'loading' ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground">Campañas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(campaign => (
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
          {activeMissions.map(mission => (
            <MissionItem key={mission.id} mission={mission} userProgress={progress[mission.id]} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default MissionsPage;
