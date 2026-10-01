import type { Campaign } from '@/types/campaign';

export interface CampaignProposal extends Campaign {
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string;
}
