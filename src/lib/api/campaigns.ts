import type { Campaign, CampaignStatus, CampaignType } from '@/types/campaign';
import type { Mission, UserMissionProgress } from '@/types/mission';
import { apiFetch } from './client';

export const CAMPAIGNS_PATH = '/api/v1/campaigns/';
const MAX_PAGES = 20;

export interface CampaignsData {
  campaigns: Campaign[];
  missions: Mission[];
  progress: Record<string, UserMissionProgress>;
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
 * Backend status -> UI status.
 */
function mapStatus(value: unknown): CampaignStatus {
  if (value === 'IN_PROGRESS') return 'ACTIVE';
  if (value === 'FINISHED') return 'ENDED';
  return 'UPCOMING';
}

/**
 * Backend has no campaign "type"; derive from scope.
 */
function mapType(scope: unknown): CampaignType {
  return scope === 'PRIVATE' ? 'RETO' : 'CAMPANA';
}

/**
 * Read a DRF error body into one message.
 */
async function readError(response: Response, fallback: string): Promise<Error> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body)) {
      const first = Object.values(body)[0];
      const message = Array.isArray(first) ? first[0] : first;
      if (typeof message === 'string') return new Error(message);
    }
  } catch {
    // body not JSON
  }
  return new Error(`${fallback} (${response.status})`);
}

function mapMission(raw: unknown, campaignId: string): Mission | null {
  if (!isRecord(raw)) return null;
  const id = readString(raw.id);
  const action = isRecord(raw.action) ? raw.action : {};
  if (!id) return null;
  return {
    id,
    campaignId,
    // API does not expose ActionMaster id; use code as stable key.
    action: { id: readString(action.code), name: readString(action.name) },
    targetCount: readNumber(raw.target_count, 1),
    pointsReward: readNumber(action.points),
  };
}

function mapProgress(raw: unknown): { missionId: string; value: UserMissionProgress } | null {
  if (!isRecord(raw)) return null;
  return {
    missionId: readString(raw.mission),
    value: {
      currentCount: readNumber(raw.current_count),
      completed: raw.is_completed === true,
    },
  };
}

/**
 * Map one campaign item into UI campaign, its missions and per-mission progress.
 */
function mapCampaign(raw: unknown): {
  campaign: Campaign;
  missions: Mission[];
  progress: Record<string, UserMissionProgress>;
} | null {
  if (!isRecord(raw)) return null;
  const id = readString(raw.id);
  if (!id) return null;

  const missions = (Array.isArray(raw.missions) ? raw.missions : [])
    .map(mission => mapMission(mission, id))
    .filter((mission): mission is Mission => mission !== null);

  const progressItems = (Array.isArray(raw.user_mission_progress) ? raw.user_mission_progress : [])
    .map(mapProgress)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const progress: Record<string, UserMissionProgress> = {};
  for (const item of progressItems) {
    if (item.missionId) {
      progress[item.missionId] = item.value;
    } else if (missions.length === 1 && progressItems.length === 1) {
      // Backend omits mission id; only unambiguous with a single mission.
      progress[missions[0].id] = item.value;
    }
  }

  return {
    campaign: {
      id,
      title: readString(raw.title),
      description: readString(raw.description),
      type: mapType(raw.scope),
      status: mapStatus(raw.status),
      startDate: readString(raw.start_date),
      endDate: readString(raw.end_date),
      missionsTotal: missions.length,
      // Works without mission id mapping.
      missionsCompleted: progressItems.filter(item => item.value.completed).length,
    },
    missions,
    progress,
  };
}

/**
 * Load all visible campaigns (follows pagination) with missions and user progress.
 */
export async function fetchCampaigns(): Promise<CampaignsData> {
  const data: CampaignsData = { campaigns: [], missions: [], progress: {} };

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await apiFetch(`${CAMPAIGNS_PATH}?page=${page}`);
    if (!response.ok) throw await readError(response, 'Failed to load campaigns');

    const payload: unknown = await response.json();
    const results = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.results)
        ? payload.results
        : null;
    if (!results) throw new Error('Unexpected campaigns response shape');

    for (const item of results) {
      const mapped = mapCampaign(item);
      if (!mapped) continue;
      data.campaigns.push(mapped.campaign);
      data.missions.push(...mapped.missions);
      Object.assign(data.progress, mapped.progress);
    }

    if (Array.isArray(payload) || !isRecord(payload) || !payload.next) break;
  }

  return data;
}

/**
 * Enroll current user in a campaign.
 */
export async function joinCampaign(campaignId: string): Promise<void> {
  const response = await apiFetch(`${CAMPAIGNS_PATH}${campaignId}/join/`, { method: 'POST' });
  if (!response.ok) throw await readError(response, 'Failed to join campaign');
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
 * Read (and lazily create) progress for a mission. Requires prior join.
 */
export async function fetchMissionProgress(missionId: string): Promise<MissionProgressResult> {
  const response = await apiFetch(`/api/v1/missions/${missionId}/progress/`);
  if (!response.ok) throw await readError(response, 'Failed to load mission progress');
  return mapProgressResult(await response.json());
}

/**
 * Update mission progress with `increment` or an absolute `current_count`.
 */
export async function updateMissionProgress(
  missionId: string,
  change: { increment: number } | { currentCount: number },
): Promise<MissionProgressResult> {
  const body = 'increment' in change ? change : { current_count: change.currentCount };
  const response = await apiFetch(`/api/v1/missions/${missionId}/progress/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await readError(response, 'Failed to update mission progress');
  return mapProgressResult(await response.json());
}
