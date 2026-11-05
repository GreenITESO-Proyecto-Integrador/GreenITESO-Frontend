import type { ActionLogStatus } from '@/types/action-audit';
import type { ActionLog } from '@/types/action-logs';
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

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Map one snake_case log from `GET /action-logs/mine/`, or null when it is unusable.
 */
function mapActionLog(raw: unknown): ActionLog | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') {
    return null;
  }
  const status = readStatus(raw.status);
  if (!status) {
    return null;
  }
  const action = isRecord(raw.action) ? raw.action : {};

  return {
    id: raw.id,
    action: {
      id: readString(action.id),
      code: readString(action.code),
      name: readString(action.name),
      validationType: readString(action.validation_type),
    },
    status,
    pointsAwarded: typeof raw.points_awarded === 'number' ? raw.points_awarded : 0,
    co2KgFactorSnapshot: readString(raw.co2_kg_factor_snapshot),
    waterLitersFactorSnapshot: readString(raw.water_liters_factor_snapshot),
    plasticKgFactorSnapshot: readString(raw.plastic_kg_factor_snapshot),
    hasEvidence: raw.has_evidence === true,
    isSharedPublicly: raw.is_shared_publicly === true,
    rejectionReason: readString(raw.rejection_reason),
    createdAt: readString(raw.created_at),
  };
}

/**
 * Load the signed-in user's own action logs, optionally filtered by status.
 */
export async function fetchMyActionLogs(status?: ActionLogStatus): Promise<ActionLog[]> {
  const query = status ? `?${new URLSearchParams({ status })}` : '';
  const response = await apiFetch(`${ACTION_LOGS_PATH}mine/${query}`);

  if (!response.ok) {
    throw await readError(response, 'No se pudo cargar tu historial de acciones.');
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new ApiError(UNREADABLE_RESPONSE, response.status);
  }

  const results = Array.isArray(raw) ? raw : isRecord(raw) ? raw.results : null;
  if (!Array.isArray(results)) {
    throw new ApiError(UNREADABLE_RESPONSE, response.status);
  }

  return results.map(mapActionLog).filter((log): log is ActionLog => log !== null);
}
