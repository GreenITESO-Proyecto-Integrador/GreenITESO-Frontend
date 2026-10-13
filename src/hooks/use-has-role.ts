import { getStoredUser } from '@/lib/auth/session';
import type { UserRole } from '@/types/auth';

/**
 * Hook to check if the current authenticated user has any of the specified roles.
 *
 * @param allowedRoles List of roles permitted to perform the action or view the element.
 * @returns boolean indicating whether the active user has at least one of the allowed roles.
 */
export function useHasRole(allowedRoles: readonly (UserRole | string)[]): boolean {
  const user = getStoredUser();
  if (!user || !user.role) {
    return false;
  }

  return allowedRoles.includes(user.role);
}

/**
 * Convenience hook to check if the active user is an administrator.
 */
export function useIsAdmin(): boolean {
  return useHasRole(['ADMIN']);
}

/**
 * Returns the active user's role or null if unauthenticated.
 */
export function useUserRole(): UserRole | string | null {
  const user = getStoredUser();
  return user?.role ?? null;
}
