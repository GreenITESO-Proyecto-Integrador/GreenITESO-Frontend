import { useCallback, useEffect, useState } from 'react';
import { fetchCampaigns, type CampaignsData } from '@/lib/api/campaigns';
import { mockCampaigns, mockMissions, mockUserProgress } from '@/pages/Missions/mock-data';

export type CampaignsStatus = 'loading' | 'success' | 'error';

const MOCK_DATA: CampaignsData = {
  campaigns: mockCampaigns,
  missions: mockMissions,
  progress: mockUserProgress,
};

/**
 * Load campaigns/missions from the API. On error, fall back to mock data.
 */
export function useCampaigns() {
  const [data, setData] = useState<CampaignsData>(MOCK_DATA);
  const [status, setStatus] = useState<CampaignsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      setData(await fetchCampaigns());
      setStatus('success');
    } catch (error) {
      setData(MOCK_DATA);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load campaigns');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, status, errorMessage, usingMock: status === 'error', reload: load };
}
