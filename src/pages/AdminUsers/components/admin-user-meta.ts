import type { AccountStatus, AdminUser, AdminUserFilter } from '@/types/admin-user';
import { USER_ROLES } from '@/types/auth';

export const FILTER_OPTIONS: readonly { value: AdminUserFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'banned', label: 'Baneados' },
  { value: 'not_banned', label: 'No baneados' },
];

export const STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: 'Activa',
  BANNED: 'Baneada',
  SELF_DEACTIVATED: 'Desactivada por el usuario',
};

const ROLE_LABEL: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.STAFF]: 'Staff',
  [USER_ROLES.STUDENT]: 'Estudiante',
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

/**
 * Best name to show for an account: full name, then nickname, then email.
 */
export function displayName(user: AdminUser): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || user.nickname || user.email;
}

/**
 * Whether the admin may ban this account. Admins and the signed-in admin cannot be banned, and
 * nothing is offered until the signed-in admin is known, so their own row is never mistaken for
 * someone else's.
 */
export function canBan(user: AdminUser, currentUserId: string | undefined): boolean {
  if (!currentUserId) return false;
  return user.status === 'ACTIVE' && user.role !== USER_ROLES.ADMIN && user.id !== currentUserId;
}
