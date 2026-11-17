import { createContext } from 'react';

export interface CurrentUserAvatarContextValue {
  /** The signed-in user's profile photo URL; empty when there is none. */
  avatarUrl: string;
  /** Call after the profile photo changes so the navbar updates without a reload. */
  setAvatarUrl: (avatarUrl: string) => void;
  /** Current local-change counter, captured before starting a profile GET. */
  getChangeCount?: () => number;
  /** Sync an avatar read from `GET /profile/me/` unless a local change happened since `changeCountAtStart`. */
  syncFetchedAvatarUrl?: (avatarUrl: string, changeCountAtStart: number) => void;
}

export const CurrentUserAvatarContext = createContext<CurrentUserAvatarContextValue | undefined>(
  undefined,
);
