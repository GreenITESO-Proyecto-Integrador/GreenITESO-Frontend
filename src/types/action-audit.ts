export type ActionLogStatus = 'APPROVED' | 'PENDING_AUDIT' | 'REJECTED';

export interface AuditActionSummary {
  id: string;
  code: string;
  name: string;
}

export interface AuditUserSummary {
  id: string;
}

export interface PendingAuditLog {
  id: string;
  status: ActionLogStatus;
  pointsAwarded: number;
  evidenceObjectKey: string;
  createdAt: string;
  action: AuditActionSummary;
  user: AuditUserSummary;
}
