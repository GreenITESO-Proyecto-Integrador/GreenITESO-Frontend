import type {
  Clan,
  ClanDetail,
  ClanListItem,
  ClanMember,
  ClanMemberRole,
  ClanMembership,
  ClanMembershipStatus,
  ClanPrivacy,
  CreateClanPayload,
} from '@/types/clan';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

export const CLANS_PATH = '/api/v1/clans/';
const MAX_PAGES = 20;
const UNREADABLE_RESPONSE = 'No se pudo leer la respuesta del servidor.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function readId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
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

function readPrivacy(value: unknown): ClanPrivacy {
  return value === 'PRIVATE_INVITE' ? 'PRIVATE_INVITE' : 'PUBLIC';
}

function readRole(value: unknown): ClanMemberRole {
  return value === 'LEADER' ? 'LEADER' : 'MEMBER';
}

function readMembershipStatus(value: unknown): ClanMembershipStatus {
  if (value === 'PENDING' || value === 'REJECTED') return value;
  return 'ACCEPTED';
}

function mapClanListItem(raw: unknown): ClanListItem | null {
  const clan = mapClan(raw);
  if (!clan || !isRecord(raw)) return null;
  return {
    ...clan,
    description: readString(raw.description),
    privacy: readPrivacy(raw.privacy),
    totalPoints: readNumber(raw.total_points),
    createdAt: readString(raw.created_at),
  };
}

function mapClanMember(raw: unknown): ClanMember | null {
  if (!isRecord(raw)) return null;
  const userId = readId(raw.user_id);
  if (!userId) return null;
  return {
    userId,
    nickname: readString(raw.nickname),
    role: readRole(raw.role),
    joinedAt: readString(raw.joined_at),
  };
}

function mapClanDetail(raw: unknown): ClanDetail | null {
  const item = mapClanListItem(raw);
  if (!item || !isRecord(raw)) return null;
  const members = Array.isArray(raw.members)
    ? raw.members.map(mapClanMember).filter((member): member is ClanMember => member !== null)
    : [];
  return { ...item, members, memberCount: readNumber(raw.member_count, members.length) };
}

function mapMembership(raw: unknown): ClanMembership | null {
  if (!isRecord(raw)) return null;
  return {
    id: readId(raw.id),
    clanId: readId(raw.clan),
    userId: readId(raw.user),
    role: readRole(raw.role),
    status: readMembershipStatus(raw.status),
    isActivePrivate: raw.is_active_private === true,
    joinedAt: readString(raw.joined_at),
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

/**
 * Load the clans directory with description, privacy and points (follows pagination).
 * The backend returns every PUBLIC clan plus the private-invite clans the user belongs to,
 * ordered by points. `search` filters by name.
 */
export async function fetchClanItems(search = ''): Promise<ClanListItem[]> {
  const items: ClanListItem[] = [];
  const term = search.trim();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const query = new URLSearchParams({ page: String(page) });
    if (term) query.set('search', term);

    const response = await apiFetch(`${CLANS_PATH}?${query.toString()}`);
    if (!response.ok) throw await readError(response, 'No se pudo cargar la lista de clanes.');

    const payload: unknown = await response.json();
    const results = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.results)
        ? payload.results
        : null;
    if (!results) throw new ApiError(UNREADABLE_RESPONSE);

    for (const raw of results) {
      const item = mapClanListItem(raw);
      if (item) items.push(item);
    }

    if (Array.isArray(payload) || !isRecord(payload) || !payload.next) break;
  }

  return items;
}

/**
 * Load one clan profile with its accepted members. A 404 means the clan does not exist,
 * was dissolved, or is an invite-only clan the user does not belong to.
 */
export async function fetchClanDetail(clanId: string): Promise<ClanDetail> {
  const response = await apiFetch(`${CLANS_PATH}${encodeURIComponent(clanId)}/`);
  if (!response.ok) throw await readError(response, 'No se pudo cargar el clan.');

  const detail = mapClanDetail(await response.json());
  if (!detail) throw new ApiError(UNREADABLE_RESPONSE);
  return detail;
}

async function sendClanRequest(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<Response> {
  const response = await apiFetch(path, init);
  if (!response.ok) throw await readError(response, fallback);
  return response;
}

function postJson(path: string, body: unknown, fallback: string): Promise<Response> {
  return sendClanRequest(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    fallback,
  );
}

async function readMembership(response: Response): Promise<ClanMembership> {
  const membership = mapMembership(await response.json());
  if (!membership) throw new ApiError(UNREADABLE_RESPONSE);
  return membership;
}

/**
 * Create a private clan. The caller becomes its leader.
 */
export async function createClan(payload: CreateClanPayload): Promise<ClanListItem> {
  const response = await postJson(
    CLANS_PATH,
    {
      name: payload.name,
      description: payload.description,
      privacy: payload.privacy,
    },
    'No se pudo crear el clan.',
  );
  const clan = mapClanListItem(await response.json());
  if (!clan) throw new ApiError(UNREADABLE_RESPONSE);
  return clan;
}

/**
 * Join a PUBLIC clan (status ACCEPTED) or file a request for an invite-only one (status PENDING).
 */
export async function joinClan(clanId: string): Promise<ClanMembership> {
  const response = await sendClanRequest(
    `${CLANS_PATH}${encodeURIComponent(clanId)}/join/`,
    { method: 'POST' },
    'No se pudo completar la solicitud.',
  );
  return readMembership(response);
}

/**
 * Leave a private clan. The leader cannot leave without transferring leadership first.
 */
export async function leaveClan(clanId: string): Promise<void> {
  await sendClanRequest(
    `${CLANS_PATH}${encodeURIComponent(clanId)}/leave/`,
    { method: 'POST' },
    'No se pudo salir del clan.',
  );
}

/**
 * Mark a private clan as the one that earns the user's team points.
 */
export async function selectActiveClan(clanId: string): Promise<ClanMembership> {
  const response = await sendClanRequest(
    `${CLANS_PATH}${encodeURIComponent(clanId)}/select-active/`,
    { method: 'POST' },
    'No se pudo establecer el clan activo.',
  );
  return readMembership(response);
}

/**
 * Leader only: hand the clan over to another accepted member.
 */
export async function transferClanLeadership(
  clanId: string,
  successorId: string,
): Promise<ClanMembership> {
  const response = await postJson(
    `${CLANS_PATH}${encodeURIComponent(clanId)}/transfer-leadership/`,
    { successor_id: successorId },
    'No se pudo transferir el liderazgo.',
  );
  return readMembership(response);
}

/**
 * Leader only: dissolve the clan (soft delete).
 */
export async function dissolveClan(clanId: string): Promise<void> {
  await sendClanRequest(
    `${CLANS_PATH}${encodeURIComponent(clanId)}/`,
    { method: 'DELETE' },
    'No se pudo disolver el clan.',
  );
}
