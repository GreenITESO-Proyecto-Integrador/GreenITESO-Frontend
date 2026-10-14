import type { ActionLogStatus } from '@/types/action-audit';
import { ACTION_LOGS_PATH } from './action-audit';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

export interface CreateActionLogPayload {
  actionId: string;
  idempotencyKey: string;
  evidenceObjectKey?: string;
}

export interface RegisteredActionLog {
  logId: string;
  status: ActionLogStatus;
  alreadyLogged: boolean;
}

const UNREADABLE_RESPONSE = 'No se pudo leer la respuesta del servidor.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStatus(value: unknown): ActionLogStatus | null {
  if (value === 'APPROVED' || value === 'PENDING_AUDIT' || value === 'REJECTED') {
    return value;
  }
  return null;
}

/**
 * Register one catalog action for the signed-in user.
 * A repeated idempotency key returns the existing log instead of creating another.
 */
export async function createActionLog(
  payload: CreateActionLogPayload,
): Promise<RegisteredActionLog> {
  const body: Record<string, string> = {
    action_id: payload.actionId,
    idempotency_key: payload.idempotencyKey,
  };
  if (payload.evidenceObjectKey) {
    body.evidence_object_key = payload.evidenceObjectKey;
  }

  const response = await apiFetch(ACTION_LOGS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await readError(response, 'No se pudo registrar la acción.');
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new ApiError(UNREADABLE_RESPONSE, response.status);
  }

  if (!isRecord(raw) || typeof raw.log_id !== 'string') {
    throw new ApiError(UNREADABLE_RESPONSE, response.status);
  }

  const status = readStatus(raw.status);
  if (!status) {
    throw new ApiError(UNREADABLE_RESPONSE, response.status);
  }

  return {
    logId: raw.log_id,
    status,
    alreadyLogged: response.status === 200,
  };
}
