export const USER_ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Standard roles share identical standard permissions and UX in GreenITESO.
 * The distinction between STUDENT and STAFF is preserved for future gamification/ranking mechanics.
 */
export const STANDARD_ROLES: readonly UserRole[] = [USER_ROLES.STUDENT, USER_ROLES.STAFF];

/**
 * Administrative roles with access to management, review, and audit tools.
 */
export const ADMIN_ROLES: readonly UserRole[] = [USER_ROLES.ADMIN];

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
  created: boolean;
}
