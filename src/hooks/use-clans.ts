import { useCallback, useEffect, useState } from 'react';
import { fetchClans } from '@/lib/api/clans';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { Clan } from '@/types/clan';

export type ClansStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Load the clan list. Stays idle while `enabled` is false.
 */
export function useClans(enabled = true) {
  const [clans, setClans] = useState<Clan[]>([]);
  const [status, setStatus] = useState<ClansStatus>(enabled ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      setClans(await fetchClans());
      setStatus('success');
    } catch (error) {
      setClans([]);
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar la lista de clanes.'));
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  return { clans, status, errorMessage, reload: load };
}
