import { useContext } from 'react';
import { CurrentUserAvatarContext } from '@/lib/current-user-avatar-context';

export function useCurrentUserAvatar() {
  const context = useContext(CurrentUserAvatarContext);
  if (!context) {
    throw new Error('useCurrentUserAvatar must be used within a CurrentUserAvatarProvider');
  }
  return context;
}
