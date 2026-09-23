import type { LoginResponse } from '@/types/auth';
import { persistSession } from '@/lib/auth/session';
import { apiFetch } from './client';

const AUTH_LOGIN_PATH = '/api/v1/auth/login/';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readLoginResponse(payload: unknown): LoginResponse {
  if (!isRecord(payload) || !isRecord(payload.user)) {
    throw new Error('Unexpected login response shape');
  }

  const user = payload.user;
  const response: LoginResponse = {
    access: readString(payload.access),
    refresh: readString(payload.refresh),
    user: {
      id: readString(user.id),
      email: readString(user.email),
      firstName: readString(user.first_name),
      lastName: readString(user.last_name),
      role: readString(user.role),
    },
    created: payload.created === true,
  };

  if (!response.access || !response.refresh || !response.user.id || !response.user.email) {
    throw new Error('Malformed login response');
  }

  return response;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message;
    }
  } catch {
    // Fall back to the HTTP status when the backend does not return JSON.
  }

  return `Login failed (${response.status})`;
}

export async function loginWithMicrosoft(
  idToken: string,
  accessToken: string,
): Promise<LoginResponse> {
  const response = await apiFetch(AUTH_LOGIN_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_token: idToken,
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Login response is not valid JSON');
  }

  return readLoginResponse(payload);
}

export function persistLogin(response: LoginResponse): void {
  persistSession(response.access, response.refresh, response.user);
}
