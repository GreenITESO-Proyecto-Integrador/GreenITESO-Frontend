import { useCallback, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchEcologicalProfile } from '@/lib/api/profile';
import type { EcologicalProfile } from '@/types/profile';

export type EcologicalProfileStatus = 'loading' | 'success' | 'error';

/**
 * Load the caller's own aggregated impact/points/streak from the API.
 */
export function useEcologicalProfile() {
  const [profile, setProfile] = useState<EcologicalProfile | null>(null);
  const [status, setStatus] = useState<EcologicalProfileStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchEcologicalProfile();
      if (requestId !== latestRequest.current) return;
      setProfile(result);
      setStatus('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar tu perfil ecológico.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, status, errorMessage, reload: load };
}
