export interface ImpactMetrics {
  co2Kg: number;
  waterLiters: number;
  plasticKg: number;
}

export interface FinishedCampaignSummary {
  id: string;
  title: string;
  endDate: string;
}

/** Caller's own aggregated profile (GET /api/v1/profile/me/). */
export interface EcologicalProfile {
  userId: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
  availablePoints: number;
  currentStreak: number;
  impactMetrics: ImpactMetrics;
  finishedCampaigns: FinishedCampaignSummary[];
}
