import { useCallback, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchCampaigns, type CampaignFilters, type CampaignsData } from '@/lib/api/campaigns';

export type CampaignsStatus = 'loading' | 'success' | 'error';

const EMPTY_DATA: CampaignsData = { campaigns: [], missions: [], progress: {} };

/**
 * Load campaigns/missions from the API.
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
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudieron cargar las campañas.'));
    }
  }, [statusFilter, scope, isActive, participating]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, status, errorMessage, reload: load };
}
