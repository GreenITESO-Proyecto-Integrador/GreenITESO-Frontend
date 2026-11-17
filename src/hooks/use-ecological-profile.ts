import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchEcologicalProfile } from '@/lib/api/ecological-profile';
import { CurrentUserAvatarContext } from '@/lib/current-user-avatar-context';
import type { EcologicalProfile } from '@/types/ecological-profile';

export type EcologicalProfileStatus = 'loading' | 'success' | 'error';

export interface UseEcologicalProfileOptions {
  /** Whether a successful load should also refresh the navbar avatar. */
  syncAvatar?: boolean;
}

/**
 * Load the ecological profile from the API and manage loading, success, and error states.
 * When `syncAvatar` is true (on `/profile`), a load also syncs `CurrentUserAvatarContext`
 * unless the user changed their photo while the request was in flight.
 */
export function useEcologicalProfile(options: UseEcologicalProfileOptions = {}) {
  const { syncAvatar = false } = options;
  const [profile, setProfileState] = useState<EcologicalProfile | null>(null);
  const [status, setStatus] = useState<EcologicalProfileStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const inFlightMountRequest = useRef<{
    promise: Promise<EcologicalProfile>;
    changeCountAtStart: number;
  } | null>(null);
  const avatarContext = useContext(CurrentUserAvatarContext);
  const setAvatarUrl = avatarContext?.setAvatarUrl;
  const getChangeCount = avatarContext?.getChangeCount;
  const syncFetchedAvatarUrl = avatarContext?.syncFetchedAvatarUrl;

  const setProfile = useCallback(
    (next: EcologicalProfile | null) => {
      setProfileState(next);
      if (next) {
        setAvatarUrl?.(next.avatarUrl ?? '');
      }
    },
    [setAvatarUrl],
  );

  const runLoad = useCallback(
    async (reuseMountRequest: boolean) => {
      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;

      setStatus('loading');
      setErrorMessage(null);

      let pending = reuseMountRequest ? inFlightMountRequest.current : null;
      if (reuseMountRequest && pending) {
        inFlightMountRequest.current = null;
      } else {
        const changeCountAtStart = getChangeCount?.() ?? 0;
        const promise = fetchEcologicalProfile();
        pending = { promise, changeCountAtStart };
        if (reuseMountRequest) {
          inFlightMountRequest.current = pending;
        }
      }

      try {
        const result = await pending.promise;
        if (inFlightMountRequest.current?.promise === pending.promise) {
          inFlightMountRequest.current = null;
        }
        if (requestId !== latestRequest.current) return;

        setProfileState(result);
        if (syncAvatar) {
          if (syncFetchedAvatarUrl) {
            syncFetchedAvatarUrl(result.avatarUrl ?? '', pending.changeCountAtStart);
          } else {
            setAvatarUrl?.(result.avatarUrl ?? '');
          }
        }
        setStatus('success');
      } catch (error) {
        if (inFlightMountRequest.current?.promise === pending.promise) {
          inFlightMountRequest.current = null;
        }
        if (requestId !== latestRequest.current) return;

        setProfileState(null);
        setStatus('error');
        setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar tu perfil ecológico.'));
      }
    },
    [getChangeCount, setAvatarUrl, syncAvatar, syncFetchedAvatarUrl],
  );

  /**
   * Fetch the profile data or re-fetch on retry.
   */
  const loadProfile = useCallback(() => runLoad(false), [runLoad]);

  useEffect(() => {
    void runLoad(true);
    return () => {
      latestRequest.current += 1;
    };
  }, [runLoad]);

  return { profile, status, errorMessage, reload: loadProfile, setProfile };
}
