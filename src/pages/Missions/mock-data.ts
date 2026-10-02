import type { Campaign } from '@/types/campaign';
import type { Mission, UserMissionProgress } from '@/types/mission';

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Semana sin plásticos',
    description:
      'Reduce el uso de plásticos de un solo uso en el campus durante toda la semana y suma puntos por cada acción registrada.',
    scope: 'GLOBAL',
    status: 'IN_PROGRESS',
    approvalStatus: 'APPROVED',
    creatorId: 'user-admin',
    targetClanId: null,
    startDate: '2026-09-15T00:00:00Z',
    endDate: '2026-12-22T00:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
    isParticipant: true,
    canManage: false,
    missionsCompleted: 1,
    missionsTotal: 3,
  },
  {
    id: 'camp-2',
    title: 'Reforestación ITESO',
    description:
      'Jornada de reforestación en el bosque del campus junto con la comunidad estudiantil.',
    scope: 'GLOBAL',
    status: 'PROMOTION',
    approvalStatus: 'APPROVED',
    creatorId: 'user-admin',
    targetClanId: null,
    startDate: '2026-12-04T00:00:00Z',
    endDate: '2026-12-04T23:59:00Z',
    createdAt: '2026-09-10T00:00:00Z',
    isParticipant: false,
    canManage: false,
    missionsCompleted: 0,
    missionsTotal: 0,
  },
  {
    id: 'camp-3',
    title: 'Mes del ahorro de agua',
    description:
      'Campaña mensual para reducir el consumo de agua en residencias y cafeterías del campus.',
    scope: 'PRIVATE',
    status: 'FINISHED',
    approvalStatus: 'APPROVED',
    creatorId: 'user-admin',
    targetClanId: 'clan-1',
    startDate: '2026-08-01T00:00:00Z',
    endDate: '2026-08-31T00:00:00Z',
    createdAt: '2026-07-20T00:00:00Z',
    isParticipant: true,
    canManage: false,
    missionsCompleted: 0,
    missionsTotal: 0,
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
  'mission-1': { missionId: 'mission-1', currentCount: 5, completed: true, targetCount: 5 },
  'mission-2': { missionId: 'mission-2', currentCount: 1, completed: false, targetCount: 3 },
  'mission-3': { missionId: 'mission-3', currentCount: 4, completed: false, targetCount: 10 },
};
