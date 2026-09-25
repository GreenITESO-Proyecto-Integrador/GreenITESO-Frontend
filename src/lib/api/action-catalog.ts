import type { ActionCategory, ActionValidationType, CatalogAction } from '@/types/action-catalog';
import { apiFetch, getApiBaseUrl } from './client';

export const ACTION_CATALOG_PATH = '/api/v1/actions/';

/**
 * Narrow unknown values to plain objects before reading catalog fields.
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
 * Read a boolean field from an untrusted payload, or return a fallback.
 */
function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Extract the action list from a raw array or a DRF-style `{ results }` body.
 */
function unwrapActionList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (isRecord(payload) && Array.isArray(payload.results)) {
    return payload.results;
  }
  throw new Error('Unexpected catalog response shape');
}

/**
 * Map backend validation codes onto the catalog union type.
 */
function mapValidationType(value: unknown): ActionValidationType {
  return value === 'PHOTO' ? 'PHOTO' : 'NONE';
}

/**
 * Map a nested or UUID-only category payload into display metadata.
 */
function mapCategory(raw: unknown): ActionCategory {
  if (typeof raw === 'string') {
    return { id: raw, code: '', name: '', description: '', icon: '' };
  }
  if (!isRecord(raw)) {
    return { id: '', code: '', name: '', description: '', icon: '' };
  }
  return {
    id: readString(raw.id),
    code: readString(raw.code),
    name: readString(raw.name),
    description: readString(raw.description),
    icon: readString(raw.icon),
  };
}

/**
 * Map one ActionMaster-shaped record, or return null when required fields are missing.
 */
function mapCatalogAction(raw: unknown): CatalogAction | null {
  if (!isRecord(raw)) {
    return null;
  }

  const action: CatalogAction = {
    id: readString(raw.id),
    code: readString(raw.code),
    category: mapCategory(raw.category),
    name: readString(raw.name),
    description: readString(raw.description),
    points: readNumber(raw.points),
    dailyLimit: readNumber(raw.daily_limit, 1),
    validationType: mapValidationType(raw.validation_type),
    co2KgFactor: readNumber(raw.co2_kg_factor),
    waterLitersFactor: readNumber(raw.water_liters_factor),
    plasticKgFactor: readNumber(raw.plastic_kg_factor),
    isActive: readBoolean(raw.is_active, true),
  };

  if (!action.id || !action.name || action.points <= 0) {
    return null;
  }

  return action;
}

/**
 * Build the absolute URL used to fetch the Team 1 action catalog.
 */
export function getActionCatalogUrl(): string {
  return `${getApiBaseUrl()}${ACTION_CATALOG_PATH}`;
}

/**
 * Load active catalog actions from the API.
 * Throws on HTTP errors, invalid JSON, unexpected shapes, or payloads with no usable actions.
 */
export async function fetchActionCatalog(): Promise<CatalogAction[]> {
  const response = await apiFetch(ACTION_CATALOG_PATH);

  if (!response.ok) {
    throw new Error(`Failed to load action catalog (${response.status})`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Catalog response is not valid JSON');
  }

  const rawActions = unwrapActionList(payload);
  const catalog = rawActions
    .map(mapCatalogAction)
    .filter((action): action is CatalogAction => action !== null)
    .filter(action => action.isActive);

  if (rawActions.length > 0 && catalog.length === 0) {
    throw new Error('Malformed catalog payload');
  }

  return catalog;
}
