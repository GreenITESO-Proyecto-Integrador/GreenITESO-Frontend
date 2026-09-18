import type { LeaderboardEntry, LeaderboardTab } from '@/types/leaderboard';

export const USER_RANKINGS_PATH = '/api/v1/rankings/users/';
export const CLAN_RANKINGS_PATH = '/api/v1/rankings/clans/';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

/**
 * Resolve the API origin from Vite env, dropping a trailing slash.
 */
function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const baseUrl =
    typeof configured === 'string' && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, '');
}

/**
 * Narrow unknown values to plain objects before reading ranking fields.
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
  throw new Error('Unexpected leaderboard response shape');
}

/**
 * Map one ranking row from snake_case API payloads.
 */
function mapLeaderboardEntry(raw: unknown, index: number): LeaderboardEntry | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id);
  const displayName =
    readString(raw.display_name) || readString(raw.name) || readString(raw.username) || id;

  if (!id || !displayName) {
    return null;
  }

  return {
    id,
    rank: readNumber(raw.rank, index + 1),
    displayName,
    totalPoints: readNumber(raw.total_points),
  };
}

/**
 * Build the ranking URL for the selected leaderboard tab.
 */
export function getLeaderboardUrl(tab: LeaderboardTab): string {
  const path = tab === 'teams' ? CLAN_RANKINGS_PATH : USER_RANKINGS_PATH;
  return `${getApiBaseUrl()}${path}`;
}

/**
 * Load ranking rows for global users or clans. Totals are display-only.
 */
export async function fetchLeaderboard(tab: LeaderboardTab): Promise<LeaderboardEntry[]> {
  const response = await fetch(getLeaderboardUrl(tab));

  if (!response.ok) {
    throw new Error(`Failed to load leaderboard (${response.status})`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Leaderboard response is not valid JSON');
  }

  return unwrapList(payload)
    .map(mapLeaderboardEntry)
    .filter((entry): entry is LeaderboardEntry => entry !== null);
}
