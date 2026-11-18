import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { FilterChips } from '@/components/shared/FilterChips';
import { Pagination } from '@/components/shared/Pagination';
import { SectionState } from '@/components/shared/SectionState';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { fetchAllFeedback } from '@/lib/api/feedback';
import { cn } from '@/lib/utils';
import type { FeedbackCategory, FeedbackStatus, FeedbackSubmission } from '@/types/feedback';
import { AdminFeedbackCard } from './components/AdminFeedbackCard';

type StatusFilter = FeedbackStatus | 'all';
type CategoryFilter = FeedbackCategory | 'all';

const STATUS_FILTERS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'OPEN', label: 'Recibidos' },
  { value: 'IN_REVIEW', label: 'En revisión' },
  { value: 'RESOLVED', label: 'Resueltos' },
];

const CATEGORY_FILTERS: readonly { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'BUG', label: 'Errores' },
  { value: 'IDEA', label: 'Ideas' },
  { value: 'ECO_ACTION', label: 'Acciones eco' },
  { value: 'ACCESSIBILITY', label: 'Accesibilidad' },
  { value: 'OTHER', label: 'Otros' },
];

/**
 * Admin window to read all feedback, set its status and reply with notes.
 */
export function AdminFeedbackPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');

  // The page belongs to the filters it was chosen for: other filters mean page 1 again.
  const queryKey = `${status}|${category}`;
  const [chosen, setChosen] = useState({ key: queryKey, page: 1 });
  const page = chosen.key === queryKey ? chosen.page : 1;
  const setPage = useCallback(
    (next: number) => setChosen({ key: queryKey, page: next }),
    [queryKey],
  );

  const [items, setItems] = useState<FeedbackSubmission[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);
  const loadStateRef = useRef<'loading' | 'success' | 'error'>('loading');

  const changeLoadState = useCallback((next: 'loading' | 'success' | 'error') => {
    loadStateRef.current = next;
    setLoadState(next);
  }, []);

  const load = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    if (loadStateRef.current === 'success') setRefreshing(true);
    else changeLoadState('loading');
    setErrorMessage(null);
    try {
      const result = await fetchAllFeedback({ status, category, page });
      if (requestId !== latestRequest.current) return;
      setItems(result.items);
      setTotalPages(result.totalPages);
      changeLoadState('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      if (error instanceof ApiError && error.status === 404 && page > 1) {
        setPage(page - 1);
        return;
      }
      setItems([]);
      changeLoadState('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudieron cargar los comentarios.'));
    } finally {
      if (requestId === latestRequest.current) setRefreshing(false);
    }
  }, [status, category, page, changeLoadState, setPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdated = useCallback((updated: FeedbackSubmission) => {
    setItems(prev => prev.map(item => (item.id === updated.id ? updated : item)));
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-8 pb-24">
      <header>
        <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase dark:text-primary-400">
          Administración
        </p>
        <h1 className="text-2xl font-bold text-foreground">Buzón de feedback</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Lee los comentarios de la comunidad, cambia su estado y responde con una nota que el
          usuario verá en su historial.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <FilterChips
          label="Filtrar por estado"
          options={STATUS_FILTERS}
          value={status}
          onChange={setStatus}
        />
        <FilterChips
          label="Filtrar por categoría"
          options={CATEGORY_FILTERS}
          value={category}
          onChange={setCategory}
        />
      </div>

      <SectionState
        status={loadState}
        errorMessage={errorMessage}
        onRetry={() => void load()}
        isEmpty={items.length === 0}
        loadingText="Cargando comentarios…"
        errorTitle="No se pudieron cargar los comentarios"
        emptyIcon={MessageSquare}
        emptyTitle="Sin comentarios"
        emptyText="No hay comentarios con esos filtros. Prueba con otros."
      >
        <ul
          aria-label="Comentarios"
          aria-busy={refreshing}
          className={cn('flex flex-col gap-4 transition-opacity', refreshing && 'opacity-60')}
        >
          {items.map(item => (
            <AdminFeedbackCard key={item.id} item={item} onUpdated={handleUpdated} />
          ))}
        </ul>
      </SectionState>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label="comentarios" />
    </div>
  );
}

export default AdminFeedbackPage;
