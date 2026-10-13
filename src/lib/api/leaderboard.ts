import type { LeaderboardEntry, LeaderboardPage, LeaderboardTab } from '@/types/leaderboard';
import { LEADERBOARD_PAGE_SIZE } from '@/types/leaderboard';
import { apiFetch, getApiBaseUrl } from './client';

export const USER_RANKINGS_PATH = '/api/v1/rankings/users/';
export const CLAN_RANKINGS_PATH = '/api/v1/rankings/';

const CLAN_RANKING_TYPES = {
  institutional: 'INSTITUTIONAL',
  private_clan: 'PRIVATE_CLAN',
} as const;

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
 * Read DRF LimitOffsetPagination `count`, or fall back to the unwrapped list length.
 */
function readCount(payload: unknown, resultCount: number): number {
  if (isRecord(payload) && typeof payload.count === 'number' && Number.isFinite(payload.count)) {
    return payload.count;
  }
  return resultCount;
}

/**
 * Map one ranking row from snake_case API payloads (users or clans).
 */
function mapLeaderboardEntry(raw: unknown, index: number): LeaderboardEntry | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id);
  const displayName =
    readString(raw.display_name) ||
    readString(raw.clan_name) ||
    readString(raw.name) ||
    readString(raw.username) ||
    id;

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

export interface FetchLeaderboardOptions {
  limit?: number;
  offset?: number;
}

/**
 * Build the ranking path for the selected tab, including limit/offset query params.
 */
export function getLeaderboardPath(
  tab: LeaderboardTab,
  options: FetchLeaderboardOptions = {},
): string {
  const limit = options.limit ?? LEADERBOARD_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const paging = `limit=${limit}&offset=${offset}`;

  if (tab === 'global') {
    return `${USER_RANKINGS_PATH}?${paging}`;
  }

  const rankingType = CLAN_RANKING_TYPES[tab];
  return `${CLAN_RANKINGS_PATH}?type=${rankingType}&${paging}`;
}

/**
 * Build the absolute ranking URL for the selected leaderboard tab.
 */
export function getLeaderboardUrl(
  tab: LeaderboardTab,
  options: FetchLeaderboardOptions = {},
): string {
  return `${getApiBaseUrl()}${getLeaderboardPath(tab, options)}`;
}

/**
 * Load one page of ranking rows. Totals are display-only; ranks come from the API.
 */
export async function fetchLeaderboard(
  tab: LeaderboardTab,
  options: FetchLeaderboardOptions = {},
): Promise<LeaderboardPage> {
  const limit = options.limit ?? LEADERBOARD_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const response = await apiFetch(getLeaderboardPath(tab, { limit, offset }));

  if (!response.ok) {
    throw new Error(`Failed to load leaderboard (${response.status})`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Leaderboard response is not valid JSON');
  }

  const entries = unwrapList(payload)
    .map(mapLeaderboardEntry)
    .filter((entry): entry is LeaderboardEntry => entry !== null);

  return {
    entries,
    count: readCount(payload, entries.length),
    limit,
    offset,
  };
}
