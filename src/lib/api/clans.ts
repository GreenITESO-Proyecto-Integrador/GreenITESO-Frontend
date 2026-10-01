import type { Clan } from '@/types/clan';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

export const CLANS_PATH = '/api/v1/clans/';
const MAX_PAGES = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapClan(raw: unknown): Clan | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === 'string' || typeof raw.id === 'number' ? String(raw.id) : '';
  if (!id) return null;
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    type: typeof raw.type === 'string' ? raw.type : '',
  };
}

/**
 * Load clans (follows pagination). Only used to show a clan name.
 */
export async function fetchClans(): Promise<Clan[]> {
  const clans: Clan[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await apiFetch(`${CLANS_PATH}?page=${page}`);
    if (!response.ok) throw await readError(response, 'No se pudo cargar la lista de clanes.');

    const payload: unknown = await response.json();
    const results = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.results)
        ? payload.results
        : null;
    if (!results) throw new ApiError('No se pudo leer la respuesta del servidor.');

    for (const item of results) {
      const clan = mapClan(item);
      if (clan) clans.push(clan);
    }

    if (Array.isArray(payload) || !isRecord(payload) || !payload.next) break;
  }

  return clans;
}
