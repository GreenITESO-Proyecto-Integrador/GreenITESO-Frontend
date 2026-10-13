import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCampaignDetail } from '@/lib/api/campaigns';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { CampaignDetail } from '@/types/campaign';

export type CampaignDetailStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Load one campaign (missions, user progress, participants). Pass null to stay idle.
 */
export function useCampaignDetail(campaignId: string | null) {
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [status, setStatus] = useState<CampaignDetailStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  /**
   * Fetch the detail. `silent` keeps the current content on screen while refreshing.
   */
  const load = useCallback(
    async (silent = false) => {
      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;

      if (!campaignId) {
        setDetail(null);
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      if (!silent) {
        setStatus('loading');
        setDetail(null);
      }
      setErrorMessage(null);
      try {
        const result = await fetchCampaignDetail(campaignId);
        if (requestId !== latestRequest.current) return;
        setDetail(result);
        setStatus('success');
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        setStatus('error');
        setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar la campaña.'));
      }
    },
    [campaignId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { detail, status, errorMessage, reload, refresh };
}
