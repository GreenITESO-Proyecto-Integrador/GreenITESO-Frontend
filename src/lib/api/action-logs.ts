import type { ActionLogStatus } from '@/types/action-audit';
import { ACTION_LOGS_PATH } from './action-audit';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

export interface CreateActionLogPayload {
  actionId: string;
  idempotencyKey: string;
  evidence?: File | null;
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
 * Build the multipart body for a log that includes a photograph.
 * Content-Type stays unset so the browser can add the multipart boundary.
 */
function actionLogFormData(payload: CreateActionLogPayload, evidence: File): FormData {
  const body = new FormData();
  body.append('action_id', payload.actionId);
  body.append('idempotency_key', payload.idempotencyKey);
  body.append('evidence', evidence);
  return body;
}

/**
 * Register one catalog action for the signed-in user.
 * A photo goes as multipart field `evidence`. The server stores the bytes and
 * writes the real object key; this client does not choose disk or bucket.
 * A repeated idempotency key returns the existing log instead of creating another.
 */
export async function createActionLog(
  payload: CreateActionLogPayload,
): Promise<RegisteredActionLog> {
  const evidence = payload.evidence ?? null;
  const response = await apiFetch(
    ACTION_LOGS_PATH,
    evidence
      ? { method: 'POST', body: actionLogFormData(payload, evidence) }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_id: payload.actionId,
            idempotency_key: payload.idempotencyKey,
          }),
        },
  );

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
