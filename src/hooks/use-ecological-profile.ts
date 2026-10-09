import { useCallback, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchEcologicalProfile } from '@/lib/api/ecological-profile';
import type { EcologicalProfile } from '@/types/ecological-profile';

export type EcologicalProfileStatus = 'loading' | 'success' | 'error';

/**
 * Load the ecological profile from the API and manage loading, success, and error states.
 */
export function useEcologicalProfile() {
  const [profile, setProfile] = useState<EcologicalProfile | null>(null);
  const [status, setStatus] = useState<EcologicalProfileStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  /**
   * Fetch the profile data or re-fetch on retry.
   */
  const loadProfile = useCallback(async () => {
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

      setProfile(null);
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar tu perfil ecológico.'));
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return { profile, status, errorMessage, reload: loadProfile };
}
