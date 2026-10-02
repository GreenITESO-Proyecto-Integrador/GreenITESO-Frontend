import { useCallback, useEffect, useState } from 'react';
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

  /**
   * Fetch the profile data or re-fetch on retry.
   */
  const loadProfile = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const data = await fetchEcologicalProfile();
      setProfile(data);
      setStatus('success');
    } catch (error) {
      setProfile(null);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo cargar el perfil ecológico',
      );
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return { profile, status, errorMessage, reload: loadProfile, setProfile };
}
