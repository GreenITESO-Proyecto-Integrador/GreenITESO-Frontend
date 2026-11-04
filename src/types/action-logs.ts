import type { ActionLogStatus } from './action-audit';

export type { ActionLogStatus };

export interface ActionLog {
  id: string;
  action: {
    id: string;
    code: string;
    name: string;
    validationType: string;
  };
  status: ActionLogStatus;
  pointsAwarded: number;
  co2KgFactorSnapshot: string;
  waterLitersFactorSnapshot: string;
  plasticKgFactorSnapshot: string;
  hasEvidence: boolean;
  isSharedPublicly: boolean;
  rejectionReason: string;
  createdAt: string;
}
