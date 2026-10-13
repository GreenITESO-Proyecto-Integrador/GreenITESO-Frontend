import { getStoredUser } from '@/lib/auth/session';
import { USER_ROLES } from '@/types/auth';

/**
 * Current user and role, read from the stored session.
 */
export function useCurrentUser() {
  const user = getStoredUser();
  const role = user?.role ?? null;
  return { user, role, isAdmin: role === USER_ROLES.ADMIN };
}
