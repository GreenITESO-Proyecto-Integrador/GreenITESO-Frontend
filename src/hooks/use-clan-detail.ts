import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClanDetail } from '@/lib/api/clans';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import type { ClanDetail } from '@/types/clan';

export type ClanDetailStatus = 'loading' | 'success' | 'error' | 'not-found';

/**
 * Load one clan profile. `not-found` covers dissolved clans and invite-only clans the user
 * cannot see. `reload({ silent: true })` refreshes in place, without flashing the loading state.
 */
export function useClanDetail(clanId: string | undefined) {
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [status, setStatus] = useState<ClanDetailStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = ++latestRequest.current;
      if (!clanId) {
        setClan(null);
        setStatus('not-found');
        return;
      }
      if (!silent) {
        setStatus('loading');
        setErrorMessage(null);
      }
      try {
        const detail = await fetchClanDetail(clanId);
        if (requestId !== latestRequest.current) return;
        setClan(detail);
        setStatus('success');
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        setClan(null);
        if (error instanceof ApiError && error.status === 404) {
          setStatus('not-found');
        } else {
          setStatus('error');
          setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar el clan.'));
        }
      }
    },
    [clanId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { clan, status, errorMessage, reload: load };
}
