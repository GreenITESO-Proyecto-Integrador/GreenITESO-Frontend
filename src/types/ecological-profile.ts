export type ProfileVisibility = 'PUBLIC' | 'PRIVATE';

export interface ImpactMetrics {
  co2Kg: number;
  waterLiters: number;
  plasticKg: number;
}

export interface ClanSummary {
  id: string;
  name: string;
}

export interface FinishedCampaign {
  id: string;
  title: string;
  endDate: string;
}

export interface Badge {
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  unlockedAt?: string;
  [key: string]: unknown;
}

export interface EcologicalProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  visibility: ProfileVisibility;
  bio?: string;
  avatarUrl?: string;
  totalPoints: number;
  availablePoints: number;
  currentStreak: number;
  level: number | null;
  badges: Badge[];
  impactMetrics: ImpactMetrics;
  finishedCampaigns: FinishedCampaign[];
  institutionalClan: ClanSummary | null;
  activePrivateClan: ClanSummary | null;
}
