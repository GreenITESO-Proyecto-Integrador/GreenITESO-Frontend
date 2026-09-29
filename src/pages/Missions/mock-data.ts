import type { Campaign } from '@/types/campaign';
import type { Mission, UserMissionProgress } from '@/types/mission';

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Semana sin plásticos',
    description:
      'Reduce el uso de plásticos de un solo uso en el campus durante toda la semana y suma puntos por cada acción registrada.',
    type: 'RETO',
    status: 'ACTIVE',
    startDate: '2026-09-15T00:00:00Z',
    endDate: '2026-09-22T00:00:00Z',
    missionsCompleted: 2,
    missionsTotal: 4,
  },
  {
    id: 'camp-2',
    title: 'Reforestación ITESO',
    description:
      'Jornada de reforestación en el bosque del campus junto con la comunidad estudiantil.',
    type: 'EVENTO',
    status: 'UPCOMING',
    startDate: '2026-10-04T00:00:00Z',
    endDate: '2026-10-04T00:00:00Z',
  },
  {
    id: 'camp-3',
    title: 'Mes del ahorro de agua',
    description:
      'Campaña mensual para reducir el consumo de agua en residencias y cafeterías del campus.',
    type: 'CAMPANA',
    status: 'ENDED',
    startDate: '2026-08-01T00:00:00Z',
    endDate: '2026-08-31T00:00:00Z',
    missionsCompleted: 6,
    missionsTotal: 6,
  },
];

export const mockMissions: Mission[] = [
  {
    id: 'mission-1',
    campaignId: 'camp-1',
    action: { id: 'action-1', name: 'Rechaza un popote o bolsa de plástico' },
    targetCount: 5,
    pointsReward: 50,
  },
  {
    id: 'mission-2',
    campaignId: 'camp-1',
    action: { id: 'action-2', name: 'Lleva tu propio termo o botella reutilizable' },
    targetCount: 3,
    pointsReward: 30,
  },
  {
    id: 'mission-3',
    campaignId: 'camp-1',
    action: { id: 'action-3', name: 'Separa tus residuos correctamente' },
    targetCount: 10,
    pointsReward: 80,
  },
];

export const mockUserProgress: Record<string, UserMissionProgress> = {
  'mission-1': { currentCount: 5, completed: true },
  'mission-2': { currentCount: 1, completed: false },
  'mission-3': { currentCount: 4, completed: false },
};
