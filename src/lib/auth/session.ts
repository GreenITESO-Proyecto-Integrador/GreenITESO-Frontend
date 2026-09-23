import type { AuthUser } from '@/types/auth';

export const AUTH_STORAGE_KEYS = {
  access: 'greeniteso.access_token',
  refresh: 'greeniteso.refresh_token',
  user: 'greeniteso.user',
} as const;

const REFRESH_PATH = '/api/v1/auth/refresh/';
const DEFAULT_API_BASE_URL = 'http://localhost:8000';
let refreshInFlight: Promise<string | null> | null = null;

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const baseUrl =
    typeof configured === 'string' && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, '');
}

function readTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(
      decodeURIComponent(
        window
          .atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(character => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(''),
      ),
    ) as { exp?: unknown };

    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null, leewaySeconds = 30): boolean {
  if (!token) {
    return true;
  }

  const expiration = readTokenExpiration(token);
  return expiration === null || expiration * 1000 <= Date.now() + leewaySeconds * 1000;
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.access);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.refresh);
}

export function getStoredUser(): AuthUser | null {
  const rawUser = sessionStorage.getItem(AUTH_STORAGE_KEYS.user);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  return !isTokenExpired(getAccessToken());
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshInFlight = (async () => {
    const response = await fetch(`${getApiBaseUrl()}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const payload: unknown = await response.json();
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('access' in payload) ||
      typeof payload.access !== 'string'
    ) {
      clearSession();
      return null;
    }

    sessionStorage.setItem(AUTH_STORAGE_KEYS.access, payload.access);
    return payload.access;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function ensureAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  if (!isTokenExpired(accessToken)) {
    return accessToken;
  }

  return refreshAccessToken();
}

export function persistSession(access: string, refresh: string, user: AuthUser): void {
  sessionStorage.setItem(AUTH_STORAGE_KEYS.access, access);
  sessionStorage.setItem(AUTH_STORAGE_KEYS.refresh, refresh);
  sessionStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearSession(): void {
  Object.values(AUTH_STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
}
