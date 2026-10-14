import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClanItems } from '@/lib/api/clans';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { ClanListItem } from '@/types/clan';

export type ClanSearchStatus = 'loading' | 'success' | 'error';

/**
 * Load the clans directory, filtered by name. Reloads whenever `search` changes and ignores
 * answers that arrive after a newer request.
 */
export function useClanSearch(search: string) {
  const [clans, setClans] = useState<ClanListItem[]>([]);
  const [status, setStatus] = useState<ClanSearchStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setStatus('loading');
    setErrorMessage(null);
    try {
      const items = await fetchClanItems(search);
      if (requestId !== latestRequest.current) return;
      setClans(items);
      setStatus('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setClans([]);
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar la lista de clanes.'));
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  return { clans, status, errorMessage, reload: load };
}
