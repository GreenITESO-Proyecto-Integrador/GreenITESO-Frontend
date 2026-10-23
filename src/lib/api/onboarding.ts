import { apiFetch } from './client';
import { ApiError, readError } from './errors';

const ONBOARDING_PATH = '/api/v1/clans/institutional-clan/';
const CAREERS_PATH = '/api/v1/clans/institutional-clan/careers/';
const UNREADABLE_RESPONSE = 'No se pudo leer la respuesta del servidor.';

export type ProfileVisibility = 'PUBLIC' | 'PRIVATE';

export interface OnboardingState {
  career: string;
  /** True only when the backend explicitly reports no institutional clan. */
  needsOnboarding: boolean;
}

export interface OnboardingPayload {
  career: string;
  nickname?: string;
  visibility?: ProfileVisibility;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapState(raw: unknown): OnboardingState {
  if (!isRecord(raw)) throw new ApiError(UNREADABLE_RESPONSE);
  return {
    career: typeof raw.career === 'string' ? raw.career : '',
    needsOnboarding: 'institutional_clan' in raw && raw.institutional_clan === null,
  };
}

/**
 * The caller's institutional clan assignment. Without one, actions cannot be logged.
 */
export async function fetchOnboardingState(): Promise<OnboardingState> {
  const response = await apiFetch(ONBOARDING_PATH);
  if (!response.ok) throw await readError(response, 'No se pudo cargar tu perfil.');
  return mapState(await response.json());
}

/**
 * Careers offered in the onboarding picker, sorted by the backend.
 */
export async function fetchCareers(): Promise<string[]> {
  const response = await apiFetch(CAREERS_PATH);
  if (!response.ok) throw await readError(response, 'No se pudieron cargar las carreras.');
  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.careers)) {
    throw new ApiError(UNREADABLE_RESPONSE);
  }
  return payload.careers.filter((career): career is string => typeof career === 'string');
}

/**
 * Declare the career (assigns the institutional clan) plus the optional nickname and visibility.
 */
export async function completeOnboarding(payload: OnboardingPayload): Promise<OnboardingState> {
  const response = await apiFetch(ONBOARDING_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await readError(response, 'No se pudo guardar tu carrera.');
  return mapState(await response.json());
}
