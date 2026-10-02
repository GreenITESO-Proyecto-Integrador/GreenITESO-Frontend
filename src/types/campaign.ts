import type { Mission, UserMissionProgress } from '@/types/mission';

export type CampaignScope = 'GLOBAL' | 'PRIVATE';
export type CampaignStatus = 'PROMOTION' | 'IN_PROGRESS' | 'FINISHED';
export type CampaignApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  scope: CampaignScope;
  status: CampaignStatus;
  approvalStatus: CampaignApprovalStatus;
  creatorId: string;
  targetClanId: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  isParticipant: boolean;
  canManage: boolean;
  missionsTotal: number;
  missionsCompleted: number;
}

export interface CampaignParticipant {
  campaignId: string;
  userId: string;
  joinedAt: string;
}

export interface CampaignDetail extends Campaign {
  missions: Mission[];
  progress: Record<string, UserMissionProgress>;
  participants: CampaignParticipant[];
}
