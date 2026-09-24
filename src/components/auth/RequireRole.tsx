import type { ReactNode } from 'react';
import { useHasRole } from '@/hooks/use-has-role';
import type { UserRole } from '@/types/auth';

export interface RequireRoleProps {
  allowedRoles: readonly (UserRole | string)[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children if the authenticated user has any of the `allowedRoles`.
 * If not authorized, optionally renders `fallback` (defaults to null).
 */
export function RequireRole({ allowedRoles, children, fallback = null }: RequireRoleProps) {
  const hasAccess = useHasRole(allowedRoles);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
