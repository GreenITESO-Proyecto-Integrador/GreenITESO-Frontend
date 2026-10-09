import type { ActionLogStatus, AuditActionSummary, PendingAuditLog } from '@/types/action-audit';
import { apiFetch, getApiBaseUrl } from './client';

export const ACTION_LOGS_PATH = '/api/v1/action-logs/';

/**
 * Narrow unknown values to plain objects before reading audit fields.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Read a string field from an untrusted payload, or return a fallback.
 */
function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Read a finite number from a JSON number or numeric string.
 */
function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Extract a list from a raw array or a DRF-style `{ results }` body.
 */
function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (isRecord(payload) && Array.isArray(payload.results)) {
    return payload.results;
  }
  throw new Error('Unexpected audit queue response shape');
}

/**
 * Map nested ActionMaster metadata used on the audit card.
 */
function mapActionSummary(raw: unknown): AuditActionSummary {
  if (!isRecord(raw)) {
    return { id: '', code: '', name: '' };
  }
  return {
    id: readString(raw.id),
    code: readString(raw.code),
    name: readString(raw.name),
  };
}

/**
 * Map a nested or UUID-only user reference without modeling Team 2 identity.
 */
function mapUserSummary(raw: unknown): { id: string } {
  if (typeof raw === 'string') {
    return { id: raw };
  }
  if (!isRecord(raw)) {
    return { id: '' };
  }
  return { id: readString(raw.id) };
}

/**
 * Map one ActionLog record, or return null when it is not a usable pending item.
 */
function mapPendingAuditLog(raw: unknown): PendingAuditLog | null {
  if (!isRecord(raw)) {
    return null;
  }

  const status = readString(raw.status) as ActionLogStatus;
  const log: PendingAuditLog = {
    id: readString(raw.id),
    status,
    pointsAwarded: readNumber(raw.points_awarded),
    evidenceObjectKey: readString(raw.evidence_object_key),
    createdAt: readString(raw.created_at),
    action: mapActionSummary(raw.action),
    user: mapUserSummary(raw.user),
  };

  if (!log.id || log.status !== 'PENDING_AUDIT') {
    return null;
  }

  return log;
}

/**
 * Build the list URL for action logs waiting on photo audit.
 */
export function getPendingAuditLogsUrl(): string {
  return `${getApiBaseUrl()}${ACTION_LOGS_PATH}?status=PENDING_AUDIT`;
}

/**
 * Load PENDING_AUDIT action logs from the Team 1 audit queue.
 */
export async function fetchPendingAuditLogs(): Promise<PendingAuditLog[]> {
  const response = await apiFetch(`${ACTION_LOGS_PATH}?status=PENDING_AUDIT`);

  if (!response.ok) {
    throw new Error(`Failed to load audit queue (${response.status})`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Audit queue response is not valid JSON');
  }

  return unwrapList(payload)
    .map(mapPendingAuditLog)
    .filter((log): log is PendingAuditLog => log !== null);
}

/**
 * Ask the backend to approve a pending log. Point credits stay in the server transaction.
 */
export async function approveAuditLog(logId: string): Promise<void> {
  const response = await apiFetch(`${ACTION_LOGS_PATH}${logId}/approve/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to approve evidence (${response.status})`);
  }
}

/**
 * Ask the backend to reject a pending log with an audit reason.
 */
export async function rejectAuditLog(logId: string, rejectionReason: string): Promise<void> {
  const response = await apiFetch(`${ACTION_LOGS_PATH}${logId}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reject evidence (${response.status})`);
  }
}
