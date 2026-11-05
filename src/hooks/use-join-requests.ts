import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJoinRequests } from '@/lib/api/clans';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { ClanJoinRequest } from '@/types/clan';

export type JoinRequestsStatus = 'loading' | 'success' | 'error';

/**
 * Load a clan's pending join requests (leader only). `remove` drops a request that was just
 * accepted or rejected so the list updates without another round trip.
 */
export function useJoinRequests(clanId: string) {
  const [requests, setRequests] = useState<ClanJoinRequest[]>([]);
  const [status, setStatus] = useState<JoinRequestsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setStatus('loading');
    setErrorMessage(null);
    try {
      const items = await fetchJoinRequests(clanId);
      if (requestId !== latestRequest.current) return;
      setRequests(items);
      setStatus('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setRequests([]);
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudieron cargar las solicitudes.'));
    }
  }, [clanId]);

  useEffect(() => {
    void load();
    return () => {
      // Ignore a response that arrives after the clan changed or the section unmounted.
      latestRequest.current += 1;
    };
  }, [load]);

  const remove = useCallback((id: string) => {
    setRequests(current => current.filter(request => request.id !== id));
  }, []);

  return { requests, status, errorMessage, reload: load, remove };
}
