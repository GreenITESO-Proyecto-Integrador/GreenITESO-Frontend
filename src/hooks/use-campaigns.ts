import { useCallback, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchCampaigns, type CampaignFilters, type CampaignsData } from '@/lib/api/campaigns';
import { mockCampaigns, mockMissions, mockUserProgress } from '@/pages/Missions/mock-data';

export type CampaignsStatus = 'loading' | 'success' | 'error';

const EMPTY_DATA: CampaignsData = { campaigns: [], missions: [], progress: {} };

/**
 * Mock data narrowed by the same filters the API would apply.
 */
function getMockData({ status, scope, participating }: CampaignFilters): CampaignsData {
  const campaigns = mockCampaigns.filter(
    campaign =>
      (status === undefined || campaign.status === status) &&
      (scope === undefined || campaign.scope === scope) &&
      (participating === undefined || campaign.isParticipant === participating),
  );
  const campaignIds = new Set(campaigns.map(campaign => campaign.id));
  const missions = mockMissions.filter(mission => campaignIds.has(mission.campaignId));
  const progress = Object.fromEntries(
    missions
      .filter(mission => mockUserProgress[mission.id])
      .map(mission => [mission.id, mockUserProgress[mission.id]]),
  );
  return { campaigns, missions, progress };
}

/**
 * Load campaigns/missions from the API. On error, fall back to mock data.
 */
export function useCampaigns(filters: CampaignFilters = {}) {
  const { status: statusFilter, scope, isActive, participating } = filters;
  const [data, setData] = useState<CampaignsData>(EMPTY_DATA);
  const [status, setStatus] = useState<CampaignsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    const activeFilters: CampaignFilters = { status: statusFilter, scope, isActive, participating };

    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchCampaigns(activeFilters);
      if (requestId !== latestRequest.current) return;
      setData(result);
      setStatus('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setData(getMockData(activeFilters));
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudieron cargar las campañas.'));
    }
  }, [statusFilter, scope, isActive, participating]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, status, errorMessage, usingMock: status === 'error', reload: load };
}
