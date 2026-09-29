export type CampaignType = 'RETO' | 'EVENTO' | 'CAMPANA';
export type CampaignStatus = 'ACTIVE' | 'UPCOMING' | 'ENDED';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  missionsCompleted?: number;
  missionsTotal?: number;
}
