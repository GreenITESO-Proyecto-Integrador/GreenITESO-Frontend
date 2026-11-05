import { apiFetch } from './client';
import { readError } from './errors';

export const NICKNAME_PATH = '/api/v1/profile/me/nickname/';

/** Longest nickname the backend accepts (`NicknameChangeSerializer`). */
export const MAX_NICKNAME_LENGTH = 50;

export interface NicknameChangeResult {
  nickname: string;
  pointsSpent: number;
  /** Balance after paying. */
  availablePoints: number;
  /** What the following change will cost. */
  nextChangeCost: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Change the signed-in user's nickname (#175). The first change is free; later ones are
 * charged to `available_points`. A rejected change throws an `ApiError` whose
 * `fieldErrors.nickname` explains why (unchanged, not enough points, invalid).
 */
export async function changeNickname(nickname: string): Promise<NicknameChangeResult> {
  const response = await apiFetch(NICKNAME_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });

  if (!response.ok) {
    throw await readError(response, 'No se pudo cambiar el nickname.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('La respuesta del servidor no es un JSON válido');
  }
  if (!isRecord(payload) || typeof payload.nickname !== 'string') {
    throw new Error('Formato de respuesta de nickname inválido');
  }

  return {
    nickname: payload.nickname,
    pointsSpent: readCount(payload.points_spent),
    availablePoints: readCount(payload.available_points),
    nextChangeCost: readCount(payload.next_change_cost),
  };
}
