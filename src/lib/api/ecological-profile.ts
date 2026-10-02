import type {
  Badge,
  ClanSummary,
  EcologicalProfile,
  FinishedCampaign,
  ImpactMetrics,
  ProfileVisibility,
} from '@/types/ecological-profile';
import { apiFetch, getApiBaseUrl } from './client';

export const ECOLOGICAL_PROFILE_PATH = '/api/v1/profile/me/';

/**
 * Narrow unknown values to plain objects before reading profile fields.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
 * Read a nullable number.
 */
function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Parse clan summary or return null.
 */
function mapClanSummary(raw: unknown): ClanSummary | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const name = readString(raw.name);
  if (!id && !name) {
    return null;
  }
  return { id, name };
}

/**
 * Parse impact metrics with default zeroes.
 */
function mapImpactMetrics(raw: unknown): ImpactMetrics {
  if (!isRecord(raw)) {
    return { co2Kg: 0, waterLiters: 0, plasticKg: 0 };
  }
  return {
    co2Kg: readNumber(raw.co2_kg ?? raw.co2Kg),
    waterLiters: readNumber(raw.water_liters ?? raw.waterLiters),
    plasticKg: readNumber(raw.plastic_kg ?? raw.plasticKg),
  };
}

/**
 * Parse finished campaigns array.
 */
function mapFinishedCampaigns(raw: unknown): FinishedCampaign[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(isRecord)
    .map(item => ({
      id: readString(item.id),
      title: readString(item.title, 'Campaña finalizada'),
      endDate: readString(item.end_date ?? item.endDate),
    }))
    .filter(campaign => Boolean(campaign.id || campaign.title));
}

/**
 * Parse badges array.
 */
function mapBadges(raw: unknown): Badge[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isRecord).map(item => ({
    id: readString(item.id),
    name: readString(item.name, 'Insignia'),
    description: readString(item.description),
    icon: readString(item.icon),
    unlockedAt: readString(item.unlocked_at ?? item.unlockedAt),
    ...item,
  }));
}

/**
 * Map raw backend ecological profile payload to typed EcologicalProfile.
 */
export function mapEcologicalProfile(payload: unknown): EcologicalProfile {
  if (!isRecord(payload)) {
    throw new Error('Formato de respuesta de perfil inválido');
  }

  const rawVisibility = readString(payload.visibility).toUpperCase();
  const visibility: ProfileVisibility = rawVisibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';

  return {
    userId: readString(payload.user_id ?? payload.userId),
    email: readString(payload.email),
    firstName: readString(payload.first_name ?? payload.firstName),
    lastName: readString(payload.last_name ?? payload.lastName),
    role: readString(payload.role),
    visibility,
    bio: readString(payload.bio),
    avatarUrl: readString(payload.avatar_url ?? payload.avatarUrl),
    totalPoints: readNumber(payload.total_points ?? payload.totalPoints),
    availablePoints: readNumber(payload.available_points ?? payload.availablePoints),
    currentStreak: readNumber(payload.current_streak ?? payload.currentStreak),
    level: readNullableNumber(payload.level),
    badges: mapBadges(payload.badges),
    impactMetrics: mapImpactMetrics(payload.impact_metrics ?? payload.impactMetrics),
    finishedCampaigns: mapFinishedCampaigns(
      payload.finished_campaigns ?? payload.finishedCampaigns,
    ),
    institutionalClan: mapClanSummary(payload.institutional_clan ?? payload.institutionalClan),
    activePrivateClan: mapClanSummary(payload.active_private_clan ?? payload.activePrivateClan),
  };
}

/**
 * Build the profile URL.
 */
export function getEcologicalProfileUrl(): string {
  return `${getApiBaseUrl()}${ECOLOGICAL_PROFILE_PATH}`;
}

/**
 * Fetch the authenticated user's ecological profile from the backend.
 */
export async function fetchEcologicalProfile(): Promise<EcologicalProfile> {
  const response = await apiFetch(ECOLOGICAL_PROFILE_PATH);

  if (!response.ok) {
    throw new Error(`Error al obtener el perfil ecológico (${response.status})`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('La respuesta del perfil ecológico no es un JSON válido');
  }

  return mapEcologicalProfile(payload);
}
