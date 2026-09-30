import type { CampaignScope, CampaignStatus } from '@/types/campaign';

export type StatusFilter = CampaignStatus | 'ALL';
export type ScopeFilter = CampaignScope | 'ALL';

export const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PROMOTION', label: 'En promoción' },
  { value: 'IN_PROGRESS', label: 'Activas' },
  { value: 'FINISHED', label: 'Finalizadas' },
];

export const SCOPE_OPTIONS: readonly { value: ScopeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'GLOBAL', label: 'Globales' },
  { value: 'PRIVATE', label: 'Privadas' },
];
