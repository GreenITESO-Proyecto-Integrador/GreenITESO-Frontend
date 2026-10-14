import type { ImpactTrendPoint } from '@/types/impact-trend';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

export const IMPACT_TREND_PATH = '/api/v1/profile/me/impact-trend/';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Read a number sent as a JSON number or a DRF DecimalField string (e.g. "12.340").
 */
function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapImpactTrendPoint(value: unknown): ImpactTrendPoint | null {
  if (!isRecord(value)) return null;
  const weekStart = readString(value.week_start);
  if (!weekStart) return null;
  return {
    weekStart,
    co2Kg: readNumber(value.co2_kg),
    waterLiters: readNumber(value.water_liters),
    plasticKg: readNumber(value.plastic_kg),
  };
}

/**
 * Load the caller's own weekly impact totals for the last 4 ISO weeks.
 * Already bucketed server-side (accounts.selectors.get_impact_trend) — this
 * only maps the response shape, no client-side aggregation.
 */
export async function fetchImpactTrend(): Promise<ImpactTrendPoint[]> {
  const response = await apiFetch(IMPACT_TREND_PATH);
  if (!response.ok) throw await readError(response, 'No se pudo cargar tu tendencia de impacto.');

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new ApiError('No se pudo leer la respuesta del servidor.');

  return payload
    .map(mapImpactTrendPoint)
    .filter((point): point is ImpactTrendPoint => point !== null);
}
