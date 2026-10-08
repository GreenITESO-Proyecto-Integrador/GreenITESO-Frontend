import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link2, Plus, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';
import { SectionState } from '@/components/shared/SectionState';
import { useClanSearch } from '@/hooks/use-clan-search';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { readNoticeState, type ClanNoticeState } from '@/lib/clan-meta';
import { ClanGrid } from './components/ClanGrid';
import { CreateClanDialog } from './components/CreateClanDialog';
import { JoinByLinkDialog } from './components/JoinByLinkDialog';
import { MyClansSection } from './components/MyClansSection';

/**
 * Clans directory: search, create a clan, and open one through an invite link.
 */
export function ClansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { clans, status, errorMessage, reload } = useClanSearch(debouncedSearch);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  // A notice sent by another page (left or dissolved a clan); cleared when dismissed.
  const [notice, setNotice] = useState<string | null>(() => readNoticeState(location.state));
  const dismissNotice = useCallback(() => setNotice(null), []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-8 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase">
            Comunidad
          </p>
          <h1 className="text-2xl font-bold text-foreground">Clanes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Únete a un clan o crea el tuyo para sumar puntos en equipo.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => setJoinOpen(true)}
            className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
          >
            <Link2 className="size-4" />
            Tengo una invitación
          </Button>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="min-h-11 shrink-0 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            <Plus className="size-4" />
            Crear clan
          </Button>
        </div>
      </header>

      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

      <MyClansSection />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground">Explorar clanes</h2>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            aria-label="Buscar clanes por nombre"
            placeholder="Buscar clanes por nombre"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <SectionState
          status={status}
          errorMessage={errorMessage}
          onRetry={() => void reload()}
          isEmpty={clans.length === 0}
          loadingText="Cargando clanes…"
          errorTitle="No se pudieron cargar los clanes"
          emptyIcon={Shield}
          emptyTitle={debouncedSearch ? 'Sin resultados' : 'Aún no hay clanes'}
          emptyText={
            debouncedSearch
              ? 'No encontramos clanes con ese nombre. Prueba con otra búsqueda.'
              : 'Sé el primero en crear un clan para tu equipo.'
          }
        >
          <ClanGrid key={debouncedSearch} clans={clans} />
        </SectionState>
      </section>

      <CreateClanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={clan => {
          setCreateOpen(false);
          const state: ClanNoticeState = { notice: `Creaste ${clan.name}. ¡Ya eres su líder!` };
          navigate(`/clans/${clan.id}`, { state });
        }}
      />
      <JoinByLinkDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onResolved={clanId => {
          setJoinOpen(false);
          navigate(`/clans/${clanId}`);
        }}
      />
    </div>
  );
}

export default ClansPage;
