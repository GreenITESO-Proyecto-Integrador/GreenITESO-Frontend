import type { CampaignsData } from '@/lib/api/campaigns';
import type { CampaignDetail } from '@/types/campaign';

/**
 * Build a detail from list data, used when the API is down and sample data is shown.
 */
export function buildFallbackDetail(
  campaignId: string | null,
  data: CampaignsData,
): CampaignDetail | null {
  const campaign = data.campaigns.find(item => item.id === campaignId);
  if (!campaign) return null;

  const missions = data.missions.filter(mission => mission.campaignId === campaign.id);
  const progress = Object.fromEntries(
    missions
      .filter(mission => data.progress[mission.id])
      .map(mission => [mission.id, data.progress[mission.id]]),
  );
  return { ...campaign, missions, progress, participants: [] };
}
