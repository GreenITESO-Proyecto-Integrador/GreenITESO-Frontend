/** BANNED: switched off by an admin. SELF_DEACTIVATED: closed by the user, who can come back. */
export type AccountStatus = 'ACTIVE' | 'BANNED' | 'SELF_DEACTIVATED';

export type AdminUserFilter = 'all' | 'banned' | 'not_banned';

export interface AdminUser {
  /** The same id an admin sees as "Proponente" on a campaign proposal. */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  role: string;
  avatarUrl: string;
  status: AccountStatus;
}

export interface AdminUsersPage {
  users: AdminUser[];
  totalPages: number;
}
