import { useEffect, useMemo, useState } from 'react';
import { fetchOwnAvatarUrl } from '@/lib/api/ecological-profile';
import { getStoredUser, updateStoredUser } from '@/lib/auth/session';
import { CurrentUserAvatarContext } from '@/lib/current-user-avatar-context';

/**
 * Holds the signed-in user's profile photo for the navbar. It starts from the
 * login payload and is refreshed from `/profile/me/` once per mount, so a photo
 * changed on another device, or a session stored before photos existed, still
 * shows up.
 */
export function CurrentUserAvatarProvider({ children }: { children: React.ReactNode }) {
  const userId = getStoredUser()?.id ?? null;
  const [avatarUrl, setAvatarUrlState] = useState(() => getStoredUser()?.avatarUrl ?? '');

  const value = useMemo(
    () => ({
      avatarUrl,
      setAvatarUrl: (next: string) => {
        setAvatarUrlState(next);
        updateStoredUser({ avatarUrl: next });
      },
    }),
    [avatarUrl],
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchOwnAvatarUrl()
      .then(url => {
        if (cancelled || url === null) return;
        setAvatarUrlState(url);
        updateStoredUser({ avatarUrl: url });
      })
      // The navbar keeps the stored photo, or the initials, if this fails.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <CurrentUserAvatarContext.Provider value={value}>{children}</CurrentUserAvatarContext.Provider>
  );
}
