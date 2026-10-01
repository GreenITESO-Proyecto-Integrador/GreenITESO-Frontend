import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAuditTab, type AuditTab } from './audit-tab';

// Same look as the Leaderboard tabs: filled green when active, white with border otherwise.
const TAB_CLASS =
  'min-h-11 w-full rounded-xl border-secondary-100 bg-white px-5 text-sm font-semibold text-secondary-500 hover:border-primary-200 hover:bg-primary-50 data-active:border-primary-500 data-active:bg-primary-500 data-active:text-white data-active:shadow-sm data-active:hover:bg-primary-500';

interface AuditTabsProps {
  value: AuditTab;
  onChange: (tab: AuditTab) => void;
}

/**
 * Tab switcher of the audit dashboard: evidence review and campaign proposals.
 */
export function AuditTabs({ value, onChange }: AuditTabsProps) {
  return (
    <Tabs value={value} onValueChange={next => onChange(parseAuditTab(String(next)))}>
      <TabsList
        aria-label="Secciones de auditoría"
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <TabsTrigger value="evidencias" className={TAB_CLASS}>
          Evidencias
        </TabsTrigger>
        <TabsTrigger value="propuestas" className={TAB_CLASS}>
          Propuestas de campañas
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
