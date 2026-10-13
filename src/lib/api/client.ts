const DEFAULT_API_BASE_URL = 'http://localhost:8000';
import { ensureAccessToken, refreshAccessToken } from '@/lib/auth/session';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const baseUrl =
    typeof configured === 'string' && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, '');
}

export async function getApiHeaders(headers?: HeadersInit): Promise<Headers> {
  const result = new Headers(headers);
  const accessToken = await ensureAccessToken();

  if (accessToken) {
    result.set('Authorization', `Bearer ${accessToken}`);
  }

  return result;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: await getApiHeaders(init.headers),
  });

  if (response.status !== 401 || path.endsWith('/auth/refresh/') || path.endsWith('/auth/login/')) {
    return response;
  }

  const accessToken = await refreshAccessToken();
  if (!accessToken) {
    return response;
  }

  const retryHeaders = await getApiHeaders(init.headers);
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: retryHeaders,
  });
}
