import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchEcologicalProfile } from '@/lib/api/ecological-profile';
import { CurrentUserAvatarContext } from '@/lib/current-user-avatar-context';
import type { EcologicalProfile } from '@/types/ecological-profile';

export type EcologicalProfileStatus = 'loading' | 'success' | 'error';

/**
 * Load the ecological profile from the API and manage loading, success, and error states.
 * Keeps `CurrentUserAvatarContext` in sync whenever the profile is loaded or updated.
 */
export function useEcologicalProfile() {
  const [profile, setProfileState] = useState<EcologicalProfile | null>(null);
  const [status, setStatus] = useState<EcologicalProfileStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const avatarContext = useContext(CurrentUserAvatarContext);
  const setAvatarUrl = avatarContext?.setAvatarUrl;

  const setProfile = useCallback(
    (next: EcologicalProfile | null) => {
      setProfileState(next);
      if (next) {
        setAvatarUrl?.(next.avatarUrl ?? '');
      }
    },
    [setAvatarUrl],
  );

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

      setProfileState(null);
      setStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar tu perfil ecológico.'));
    }
  }, [setProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return { profile, status, errorMessage, reload: loadProfile, setProfile };
}
