import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchOwnAvatarUrl } from '@/lib/api/ecological-profile';
import { getStoredUser, updateStoredUser } from '@/lib/auth/session';
import { CurrentUserAvatarContext } from '@/lib/current-user-avatar-context';

/**
 * Holds the signed-in user's profile photo for the navbar. It starts from the
 * login payload and is refreshed from `/profile/me/` once per session (except on
 * `/profile`, where `useEcologicalProfile` already loads the profile and syncs
 * the photo), so a photo changed on another device, or a session stored before
 * photos existed, still shows up. A lookup that resolves after the photo was
 * changed here is ignored, so a slow response never puts an older photo back.
 */
export function CurrentUserAvatarProvider({ children }: { children: React.ReactNode }) {
  const userId = getStoredUser()?.id ?? null;
  const { pathname } = useLocation();
  const [avatarUrl, setAvatarUrlState] = useState(() => getStoredUser()?.avatarUrl ?? '');
  // Bumped on every local change; a lookup started before a change is stale.
  const localChanges = useRef(0);
  // Tracks which user's avatar has already been refreshed from `/profile/me/`.
  const syncedUserRef = useRef<string | null>(null);

  const setAvatarUrl = useCallback((next: string) => {
    localChanges.current += 1;
    setAvatarUrlState(next);
    updateStoredUser({ avatarUrl: next });
  }, []);

  const getChangeCount = useCallback(() => localChanges.current, []);

  const syncFetchedAvatarUrl = useCallback(
    (next: string, changeCountAtStart: number) => {
      if (localChanges.current !== changeCountAtStart) return;
      syncedUserRef.current = userId;
      setAvatarUrlState(next);
      updateStoredUser({ avatarUrl: next });
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      avatarUrl,
      setAvatarUrl,
      getChangeCount,
      syncFetchedAvatarUrl,
    }),
    [avatarUrl, setAvatarUrl, getChangeCount, syncFetchedAvatarUrl],
  );

  useEffect(() => {
    if (!userId || pathname === '/profile' || syncedUserRef.current === userId) return;
    let cancelled = false;
    const changesAtStart = localChanges.current;
    fetchOwnAvatarUrl()
      .then(url => {
        if (cancelled || url === null || localChanges.current !== changesAtStart) return;
        syncedUserRef.current = userId;
        setAvatarUrlState(url);
        updateStoredUser({ avatarUrl: url });
      })
      // The navbar keeps the stored photo, or the initials, if this fails.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId, pathname]);

  return (
    <CurrentUserAvatarContext.Provider value={value}>{children}</CurrentUserAvatarContext.Provider>
  );
}
