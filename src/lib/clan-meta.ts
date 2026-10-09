import { Globe, Lock, type LucideIcon } from 'lucide-react';
import type { ClanPrivacy, ClanType } from '@/types/clan';

export const PRIVACY_META: Record<
  ClanPrivacy,
  { label: string; description: string; icon: LucideIcon; className: string }
> = {
  PUBLIC: {
    label: 'Pública',
    description: 'Cualquier persona puede unirse sin aprobación.',
    icon: Globe,
    className:
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800',
  },
  PRIVATE_INVITE: {
    label: 'Solo invitación',
    description: 'El líder aprueba cada solicitud. Los demás no ven el clan.',
    icon: Lock,
    className:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  },
};

export const PRIVACY_OPTIONS = [
  { value: 'PUBLIC', label: PRIVACY_META.PUBLIC.label },
  { value: 'PRIVATE_INVITE', label: PRIVACY_META.PRIVATE_INVITE.label },
] as const satisfies readonly { value: ClanPrivacy; label: string }[];

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function clanTypeLabel(type: ClanType): string {
  return type === 'INSTITUTIONAL' ? 'Institucional' : 'Privado';
}

export function formatPoints(points: number): string {
  return points.toLocaleString('es-MX');
}

/**
 * Display name for a roster entry; members without a nickname still need a label.
 */
export function memberDisplayName(nickname: string): string {
  return nickname.trim() || 'Miembro sin apodo';
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
  return letters.toUpperCase();
}

/**
 * "septiembre de 2026" from an ISO date, or an empty string when it cannot be read.
 */
export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

/**
 * Clan id from a pasted invite link (`https://…/clans/<id>`) or a bare id; null if none found.
 */
export function extractClanId(input: string): string | null {
  const match = input.trim().match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : null;
}

export function buildInviteLink(clanId: string): string {
  return `${window.location.origin}/clans/${clanId}`;
}

/** Router state set by a page that wants the clans list to show a success notice. */
export interface ClanNoticeState {
  notice: string;
}

export function readNoticeState(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('notice' in state)) return null;
  const { notice } = state as { notice: unknown };
  return typeof notice === 'string' && notice ? notice : null;
}
