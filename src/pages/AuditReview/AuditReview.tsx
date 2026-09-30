import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvidenceTab } from './components/EvidenceTab';
import { ProposalsTab } from './components/ProposalsTab';

// Same look as the Leaderboard tabs: filled green when active, white with border otherwise.
const TAB_CLASS =
  'min-h-11 w-full rounded-xl border-secondary-100 bg-white px-5 text-sm font-semibold text-secondary-500 hover:border-primary-200 hover:bg-primary-50 data-active:border-primary-500 data-active:bg-primary-500 data-active:text-white data-active:shadow-sm data-active:hover:bg-primary-500';

const TABS = ['evidencias', 'propuestas'] as const;
type AuditTab = (typeof TABS)[number];

function parseTab(value: string | null): AuditTab {
  return TABS.find(tab => tab === value) ?? 'evidencias';
}

/**
 * Audit dashboard (ADMIN): evidence review and campaign proposals, one tab each.
 * The active tab lives in the URL (?tab=evidencias|propuestas).
 */
export function AuditReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));

  return (
    <main className="min-h-screen bg-secondary-50 px-4 pt-8 pb-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase">
            Auditoría
          </p>
          <h1 className="text-2xl font-bold text-secondary-500">Panel de revisión</h1>
        </header>

        <Tabs
          value={tab}
          onValueChange={value => setSearchParams({ tab: String(value) }, { replace: true })}
        >
          <TabsList
            aria-label="Secciones de auditoría"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <TabsTrigger value="evidencias" className={TAB_CLASS}>
              Evidencias
            </TabsTrigger>
            <TabsTrigger value="propuestas" className={TAB_CLASS}>
              Propuestas de campañas
            </TabsTrigger>
          </TabsList>
          <TabsContent value="evidencias">
            <EvidenceTab />
          </TabsContent>
          <TabsContent value="propuestas">
            <ProposalsTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default AuditReviewPage;
