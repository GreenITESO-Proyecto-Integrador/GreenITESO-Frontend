const AUDIT_TABS = ['evidencias', 'propuestas'] as const;
export type AuditTab = (typeof AUDIT_TABS)[number];

export function parseAuditTab(value: string | null): AuditTab {
  return AUDIT_TABS.find(tab => tab === value) ?? 'evidencias';
}
