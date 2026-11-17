import type { AccountStatus, AdminUser, AdminUserFilter, AdminUsersPage } from '@/types/admin-user';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

export const USERS_PATH = '/api/v1/users/';
const UNREADABLE_RESPONSE = 'No se pudo leer la respuesta del servidor.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStatus(value: unknown): AccountStatus {
  return value === 'BANNED' || value === 'SELF_DEACTIVATED' ? value : 'ACTIVE';
}

function mapAdminUser(raw: unknown): AdminUser | null {
  if (!isRecord(raw)) return null;
  const id = readString(raw.id);
  if (!id) return null;
  return {
    id,
    email: readString(raw.email),
    firstName: readString(raw.first_name),
    lastName: readString(raw.last_name),
    nickname: readString(raw.nickname),
    role: readString(raw.role),
    avatarUrl: readString(raw.avatar_url),
    status: readStatus(raw.status),
  };
}

/**
 * Pages in the list, from what the backend says about this one. A page with a `next` link is a
 * full page, so its size is the page size; without a `next` link this is the last page.
 */
function countPages(payload: Record<string, unknown>, shown: number, page: number): number {
  const count = typeof payload.count === 'number' ? payload.count : shown;
  if (!payload.next || shown === 0) return Math.max(1, page);
  return Math.max(page, Math.ceil(count / shown));
}

interface FetchAdminUsersOptions {
  filter?: AdminUserFilter;
  /** An account id, or part of an email or name. */
  search?: string;
  page?: number;
}

/**
 * One page of accounts for the admin "Usuarios" window.
 */
export async function fetchAdminUsers({
  filter = 'all',
  search = '',
  page = 1,
}: FetchAdminUsersOptions = {}): Promise<AdminUsersPage> {
  const query = new URLSearchParams({ page: String(page) });
  if (filter !== 'all') query.set('status', filter);
  const term = search.trim();
  if (term) query.set('search', term);

  const response = await apiFetch(`${USERS_PATH}?${query.toString()}`);
  if (!response.ok) throw await readError(response, 'No se pudo cargar la lista de usuarios.');

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new ApiError(UNREADABLE_RESPONSE);
  }
  const users = payload.results.flatMap(raw => mapAdminUser(raw) ?? []);
  return { users, totalPages: countPages(payload, users.length, page) };
}

async function postUserAction(
  userId: string,
  action: 'ban' | 'unban',
  fallback: string,
): Promise<AdminUser> {
  const response = await apiFetch(`${USERS_PATH}${encodeURIComponent(userId)}/${action}/`, {
    method: 'POST',
  });
  if (!response.ok) throw await readError(response, fallback);
  const user = mapAdminUser(await response.json());
  if (!user) throw new ApiError(UNREADABLE_RESPONSE);
  return user;
}

/**
 * Switch an account off: the person is signed out everywhere and cannot sign in again.
 */
export function banUser(userId: string): Promise<AdminUser> {
  return postUserAction(userId, 'ban', 'No se pudo banear la cuenta.');
}

/**
 * Let a banned account sign in again.
 */
export function unbanUser(userId: string): Promise<AdminUser> {
  return postUserAction(userId, 'unban', 'No se pudo desbanear la cuenta.');
}
