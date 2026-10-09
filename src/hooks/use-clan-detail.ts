import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClanDetail } from '@/lib/api/clans';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import type { ClanDetail } from '@/types/clan';

export type ClanDetailStatus = 'loading' | 'success' | 'error' | 'not-found';

/**
 * Load one clan profile. `not-found` covers dissolved clans and invite-only clans the user
 * cannot see. `reload({ silent: true })` refreshes in place, without flashing the loading state;
 * if that refresh fails (other than a 404) the clan already on screen is kept and the message
 * is exposed as `refreshError` instead of replacing the page with an error.
 */
export function useClanDetail(clanId: string | undefined) {
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [status, setStatus] = useState<ClanDetailStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const hasClan = useRef(false);

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = ++latestRequest.current;
      if (!clanId) {
        hasClan.current = false;
        setClan(null);
        setStatus('not-found');
        return;
      }
      if (!silent) {
        hasClan.current = false;
        setStatus('loading');
        setErrorMessage(null);
        setRefreshError(null);
      }
      try {
        const detail = await fetchClanDetail(clanId);
        if (requestId !== latestRequest.current) return;
        hasClan.current = true;
        setClan(detail);
        setStatus('success');
        setRefreshError(null);
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        if (error instanceof ApiError && error.status === 404) {
          hasClan.current = false;
          setClan(null);
          setStatus('not-found');
          return;
        }
        const message = toFriendlyMessage(error, 'No se pudo cargar el clan.');
        if (silent && hasClan.current) {
          // Keep the profile that is already on screen.
          setRefreshError(message);
          return;
        }
        hasClan.current = false;
        setClan(null);
        setStatus('error');
        setErrorMessage(message);
      }
    },
    [clanId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { clan, status, errorMessage, refreshError, reload: load };
}
