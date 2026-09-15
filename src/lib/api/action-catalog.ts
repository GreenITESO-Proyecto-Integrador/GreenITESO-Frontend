import type { ActionCategory, ActionValidationType, CatalogAction } from '@/types/action-catalog';

export const ACTION_CATALOG_PATH = '/api/v1/actions/';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const baseUrl =
    typeof configured === 'string' && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

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

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function unwrapActionList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (isRecord(payload) && Array.isArray(payload.results)) {
    return payload.results;
  }
  throw new Error('Unexpected catalog response shape');
}

function mapValidationType(value: unknown): ActionValidationType {
  return value === 'PHOTO' ? 'PHOTO' : 'NONE';
}

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

function mapCatalogAction(raw: unknown): CatalogAction {
  if (!isRecord(raw)) {
    throw new Error('Invalid action payload');
  }

  return {
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
}

export function getActionCatalogUrl(): string {
  return `${getApiBaseUrl()}${ACTION_CATALOG_PATH}`;
}

export async function fetchActionCatalog(): Promise<CatalogAction[]> {
  const response = await fetch(getActionCatalogUrl());

  if (!response.ok) {
    throw new Error(`Failed to load action catalog (${response.status})`);
  }

  const payload: unknown = await response.json();
  return unwrapActionList(payload)
    .map(mapCatalogAction)
    .filter(action => action.isActive);
}
