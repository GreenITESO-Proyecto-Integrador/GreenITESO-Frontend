import { Globe, Users, type LucideIcon } from 'lucide-react';
import type { CampaignApprovalStatus, CampaignScope, CampaignStatus } from '@/types/campaign';

/**
 * Dark-mode colors for every progress track/fill inside a `Progress` (only colors, no sizing).
 * Applied via descendant selectors so it also covers the tracks `Progress` renders by itself.
 */
export const PROGRESS_DARK_COLORS =
  'dark:[&_[data-slot=progress-track]]:bg-white/25 dark:[&_[data-slot=progress-indicator]]:bg-primary-400';

export const SCOPE_META: Record<CampaignScope, { label: string; icon: LucideIcon }> = {
  GLOBAL: { label: 'Global', icon: Globe },
  PRIVATE: { label: 'Clan', icon: Users },
};

export const STATUS_META: Record<CampaignStatus, { label: string; className: string }> = {
  PROMOTION: {
    label: 'En promoción',
    className:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  },
  IN_PROGRESS: {
    label: 'Activa',
    className:
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800',
  },
  FINISHED: {
    label: 'Finalizada',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export const APPROVAL_META: Record<CampaignApprovalStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendiente',
    className:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  APPROVED: {
    label: 'Aprobada',
    className:
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800',
  },
  REJECTED: {
    label: 'Rechazada',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
};

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
const longDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format a backend date as "4 dic 2026", or a dash when missing/invalid.
 */
export function formatDate(value: string): string {
  const parsed = parseDate(value);
  return parsed ? longDateFormatter.format(parsed) : '—';
}

/**
 * Format a campaign period as "15 sep – 22 sep".
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return '—';
  return `${shortDateFormatter.format(start)} – ${shortDateFormatter.format(end)}`;
}
