import { useCallback, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchImpactTrend } from '@/lib/api/impact-trend';
import type { ImpactTrendPoint } from '@/types/impact-trend';

export type ImpactTrendStatus = 'loading' | 'success' | 'error';

/**
 * Load the caller's own weekly impact totals (last 4 ISO weeks) from the API.
 */
export function useImpactTrend() {
  const [points, setPoints] = useState<ImpactTrendPoint[]>([]);
  const [status, setStatus] = useState<ImpactTrendStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchImpactTrend();
      if (requestId !== latestRequest.current) return;
      setPoints(result);
      setStatus('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar tu tendencia de impacto.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { points, status, errorMessage, reload: load };
}
