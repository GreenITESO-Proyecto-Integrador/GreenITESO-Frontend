import { createContext } from 'react';

export interface CurrentUserAvatarContextValue {
  /** The signed-in user's profile photo URL; empty when there is none. */
  avatarUrl: string;
  /** Call after the profile photo changes so the navbar updates without a reload. */
  setAvatarUrl: (avatarUrl: string) => void;
}

export const CurrentUserAvatarContext = createContext<CurrentUserAvatarContextValue | undefined>(
  undefined,
);
