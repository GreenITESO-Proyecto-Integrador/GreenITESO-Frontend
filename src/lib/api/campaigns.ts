import type {
  Campaign,
  CampaignApprovalStatus,
  CampaignDetail,
  CampaignParticipant,
  CampaignScope,
  CampaignStatus,
} from '@/types/campaign';
import type { CampaignProposal } from '@/types/campaign-proposal';
import type { Mission, UserMissionProgress } from '@/types/mission';
import { apiFetch } from './client';
import { ApiError, readError } from './errors';

const UNREADABLE_RESPONSE = 'No se pudo leer la respuesta del servidor.';

export const CAMPAIGNS_PATH = '/api/v1/campaigns/';
export const PROPOSALS_PATH = `${CAMPAIGNS_PATH}proposals/`;
const MAX_PAGES = 20;

export interface CampaignsData {
  campaigns: Campaign[];
  missions: Mission[];
  progress: Record<string, UserMissionProgress>;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  scope?: CampaignScope;
  isActive?: boolean;
  participating?: boolean;
}

export interface MissionPayload {
  actionId: string;
  targetCount: number;
}

export interface CampaignPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  missions: MissionPayload[];
  /** Set to create a PRIVATE campaign for that clan; omit for GLOBAL. */
  targetClanId?: string;
}

export interface MissionProgressResult {
  currentCount: number;
  isCompleted: boolean;
  targetCount: number;
  progressPercentage: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Read an id sent as string or number, or return a fallback.
 */
function readId(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

/**
 * Read an id that may come bare or as a nested `{ id }` object.
 */
function readRefId(value: unknown): string {
  return isRecord(value) ? readId(value.id) : readId(value);
}

function mapScope(value: unknown): CampaignScope {
  return value === 'PRIVATE' ? 'PRIVATE' : 'GLOBAL';
}

function mapStatus(value: unknown): CampaignStatus {
  if (value === 'IN_PROGRESS' || value === 'FINISHED') return value;
  return 'PROMOTION';
}

function mapApprovalStatus(
  value: unknown,
  fallback: CampaignApprovalStatus,
): CampaignApprovalStatus {
  if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') return value;
  return fallback;
}

function mapMission(raw: unknown, campaignId: string): Mission | null {
  if (!isRecord(raw)) return null;
  const id = readId(raw.id);
  const action = isRecord(raw.action) ? raw.action : {};
  if (!id) return null;
  return {
    id,
    campaignId,
    // API does not expose ActionMaster id in a mission; use code as stable key.
    action: { id: readString(action.code), name: readString(action.name) },
    targetCount: readNumber(raw.target_count, 1),
    pointsReward: readNumber(action.points),
  };
}

function mapProgress(raw: unknown): UserMissionProgress | null {
  if (!isRecord(raw)) return null;
  const missionId = readRefId(raw.mission);
  if (!missionId) return null;
  return {
    missionId,
    currentCount: readNumber(raw.current_count),
    completed: raw.is_completed === true,
    targetCount: readNumber(raw.target_count, 1),
  };
}

interface MappedCampaign {
  campaign: Campaign;
  missions: Mission[];
  progress: Record<string, UserMissionProgress>;
}

/**
 * Map one campaign item into UI campaign, its missions and per-mission progress.
 */
function mapCampaign(raw: unknown): MappedCampaign | null {
  if (!isRecord(raw)) return null;
  const id = readId(raw.id);
  if (!id) return null;

  const missions = (Array.isArray(raw.missions) ? raw.missions : [])
    .map(mission => mapMission(mission, id))
    .filter((mission): mission is Mission => mission !== null);

  const progress: Record<string, UserMissionProgress> = {};
  for (const item of Array.isArray(raw.user_mission_progress) ? raw.user_mission_progress : []) {
    const mapped = mapProgress(item);
    if (mapped) progress[mapped.missionId] = mapped;
  }

  return {
    campaign: {
      id,
      title: readString(raw.title),
      description: readString(raw.description),
      scope: mapScope(raw.scope),
      status: mapStatus(raw.status),
      approvalStatus: mapApprovalStatus(raw.approval_status, 'APPROVED'),
      creatorId: readRefId(raw.creator),
      targetClanId: readRefId(raw.target_clan) || null,
      startDate: readString(raw.start_date),
      endDate: readString(raw.end_date),
      createdAt: readString(raw.created_at),
      isParticipant: raw.is_participant === true,
      canManage: raw.can_manage === true,
      missionsTotal: missions.length,
      missionsCompleted: missions.filter(mission => progress[mission.id]?.completed).length,
    },
    missions,
    progress,
  };
}

function mapParticipant(raw: unknown): CampaignParticipant | null {
  if (!isRecord(raw)) return null;
  const userId = readRefId(raw.user);
  if (!userId) return null;
  return {
    campaignId: readRefId(raw.campaign),
    userId,
    joinedAt: readString(raw.joined_at),
  };
}

function mapProposal(raw: unknown): CampaignProposal | null {
  const mapped = mapCampaign(raw);
  if (!mapped || !isRecord(raw)) return null;
  return {
    ...mapped.campaign,
    approvalStatus: mapApprovalStatus(raw.approval_status, 'PENDING'),
    reviewedById: readRefId(raw.reviewed_by) || null,
    reviewedAt: readString(raw.reviewed_at) || null,
    rejectionReason: readString(raw.rejection_reason),
  };
}

/**
 * Follow DRF pagination (`next`) and return every raw item.
 */
async function fetchAllPages(
  path: string,
  query: URLSearchParams,
  fallback: string,
): Promise<unknown[]> {
  const items: unknown[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params = new URLSearchParams(query);
    params.set('page', String(page));
    const response = await apiFetch(`${path}?${params.toString()}`);
    if (!response.ok) throw await readError(response, fallback);

    const payload: unknown = await response.json();
    const results = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.results)
        ? payload.results
        : null;
    if (!results) throw new ApiError(UNREADABLE_RESPONSE);
    items.push(...results);

    if (Array.isArray(payload) || !isRecord(payload) || !payload.next) break;
  }

  return items;
}

async function postJson(path: string, body: unknown, fallback: string): Promise<Response> {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await readError(response, fallback);
  return response;
}

function toMissionBody(missions: MissionPayload[]) {
  return missions.map(mission => ({
    action_id: mission.actionId,
    target_count: mission.targetCount,
  }));
}

/**
 * Load visible campaigns (follows pagination) with missions and user progress.
 */
export async function fetchCampaigns(filters: CampaignFilters = {}): Promise<CampaignsData> {
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.scope) query.set('scope', filters.scope);
  if (filters.isActive !== undefined) query.set('is_active', String(filters.isActive));
  if (filters.participating !== undefined)
    query.set('participating', String(filters.participating));

  const data: CampaignsData = { campaigns: [], missions: [], progress: {} };
  for (const item of await fetchAllPages(
    CAMPAIGNS_PATH,
    query,
    'No se pudieron cargar las campañas.',
  )) {
    const mapped = mapCampaign(item);
    if (!mapped) continue;
    data.campaigns.push(mapped.campaign);
    data.missions.push(...mapped.missions);
    Object.assign(data.progress, mapped.progress);
  }
  return data;
}

/**
 * Load one campaign with missions, user progress and participants.
 */
export async function fetchCampaignDetail(id: string): Promise<CampaignDetail> {
  const response = await apiFetch(`${CAMPAIGNS_PATH}${id}/`);
  if (!response.ok) throw await readError(response, 'No se pudo cargar la campaña.');

  const payload: unknown = await response.json();
  const mapped = mapCampaign(payload);
  if (!mapped || !isRecord(payload)) throw new ApiError(UNREADABLE_RESPONSE);

  const participants = (Array.isArray(payload.participants) ? payload.participants : [])
    .map(mapParticipant)
    .filter((participant): participant is CampaignParticipant => participant !== null);

  return { ...mapped.campaign, missions: mapped.missions, progress: mapped.progress, participants };
}

/**
 * Create a campaign directly: GLOBAL (ADMIN only) or, with `targetClanId`, PRIVATE.
 * Backend rules: a PRIVATE clan needs its LEADER (ADMIN cannot); an INSTITUTIONAL clan needs
 * ADMIN (LEADER cannot); other clan types are rejected.
 */
export async function createCampaign(payload: CampaignPayload): Promise<void> {
  await postJson(
    CAMPAIGNS_PATH,
    {
      title: payload.title,
      description: payload.description,
      scope: payload.targetClanId ? 'PRIVATE' : 'GLOBAL',
      ...(payload.targetClanId ? { target_clan: payload.targetClanId } : {}),
      start_date: payload.startDate,
      end_date: payload.endDate,
      missions: toMissionBody(payload.missions),
    },
    'No se pudo crear la campaña.',
  );
}

/**
 * Propose a GLOBAL campaign for admin review (non-admin only). Stays PENDING.
 */
export async function proposeCampaign(payload: CampaignPayload): Promise<void> {
  await postJson(
    PROPOSALS_PATH,
    {
      title: payload.title,
      description: payload.description,
      start_date: payload.startDate,
      end_date: payload.endDate,
      missions: toMissionBody(payload.missions),
    },
    'No se pudo enviar la propuesta.',
  );
}

export interface CampaignUpdate {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

/**
 * Edit title, description and dates of a campaign in PROMOTION (requires `can_manage`).
 */
export async function updateCampaign(campaignId: string, payload: CampaignUpdate): Promise<void> {
  const response = await apiFetch(`${CAMPAIGNS_PATH}${campaignId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      start_date: payload.startDate,
      end_date: payload.endDate,
    }),
  });
  if (!response.ok) throw await readError(response, 'No se pudo guardar la campaña.');
}

/**
 * Add a mission to a campaign in PROMOTION (requires `can_manage`).
 */
export async function addMission(campaignId: string, payload: MissionPayload): Promise<void> {
  await postJson(
    `${CAMPAIGNS_PATH}${campaignId}/missions/`,
    { action_id: payload.actionId, target_count: payload.targetCount },
    'No se pudo agregar la misión.',
  );
}

/**
 * Enroll current user in a campaign.
 */
export async function joinCampaign(campaignId: string): Promise<void> {
  const response = await apiFetch(`${CAMPAIGNS_PATH}${campaignId}/join/`, { method: 'POST' });
  if (!response.ok) throw await readError(response, 'No se pudo completar la inscripción.');
}

/**
 * Load proposals: admin sees non-admin proposals, a user sees their own.
 */
export async function fetchProposals(
  approvalStatus?: CampaignApprovalStatus,
): Promise<CampaignProposal[]> {
  const query = new URLSearchParams();
  if (approvalStatus) query.set('approval_status', approvalStatus);

  return (await fetchAllPages(PROPOSALS_PATH, query, 'No se pudieron cargar las propuestas.'))
    .map(mapProposal)
    .filter((proposal): proposal is CampaignProposal => proposal !== null);
}

/**
 * Approve a pending proposal (ADMIN only).
 */
export async function approveProposal(id: string): Promise<void> {
  await postJson(`${PROPOSALS_PATH}${id}/approve/`, {}, 'No se pudo aprobar la propuesta.');
}

/**
 * Reject a pending proposal with a required reason (ADMIN only).
 */
export async function rejectProposal(id: string, reason: string): Promise<void> {
  await postJson(
    `${PROPOSALS_PATH}${id}/reject/`,
    { rejection_reason: reason },
    'No se pudo rechazar la propuesta.',
  );
}

function mapProgressResult(raw: unknown): MissionProgressResult {
  const body = isRecord(raw) ? raw : {};
  return {
    currentCount: readNumber(body.current_count),
    isCompleted: body.is_completed === true,
    targetCount: readNumber(body.target_count),
    progressPercentage: readNumber(body.progress_percentage),
  };
}

/**
 * Read (and lazily create) progress for a mission. Read-only: progress derives from ActionLog.
 */
export async function fetchMissionProgress(missionId: string): Promise<MissionProgressResult> {
  const response = await apiFetch(`/api/v1/missions/${missionId}/progress/`);
  if (!response.ok) throw await readError(response, 'No se pudo cargar el progreso de la misión.');
  return mapProgressResult(await response.json());
}
