import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { FilterChips } from '@/components/shared/FilterChips';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { Pagination } from '@/components/shared/Pagination';
import { SectionState } from '@/components/shared/SectionState';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { fetchAllFeedback } from '@/lib/api/feedback';
import { cn } from '@/lib/utils';
import type { FeedbackCategory, FeedbackStatus, FeedbackSubmission } from '@/types/feedback';
import { CATEGORY_STYLES } from '../Feedback/components/feedback-categories';
import { STATUS_STYLES } from '../Feedback/components/feedback-statuses';
import { AdminFeedbackCard } from './components/AdminFeedbackCard';

type StatusFilter = FeedbackStatus | 'all';
type CategoryFilter = FeedbackCategory | 'all';

const STATUS_FILTER_LABELS: Record<FeedbackStatus, string> = {
  OPEN: 'Recibidos',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resueltos',
};

const STATUS_FILTERS = [
  ...(['OPEN', 'IN_REVIEW', 'RESOLVED'] as FeedbackStatus[]).map(value => ({
    value: value as StatusFilter,
    label: STATUS_FILTER_LABELS[value],
    icon: STATUS_STYLES[value].icon,
    activeClassName: STATUS_STYLES[value].classes,
  })),
  { value: 'all' as StatusFilter, label: 'Todos' },
];

const CATEGORY_FILTER_LABELS: Record<FeedbackCategory, string> = {
  BUG: 'Errores',
  IDEA: 'Ideas',
  ECO_ACTION: 'Acciones eco',
  ACCESSIBILITY: 'Accesibilidad',
  OTHER: 'Otros',
};

const CATEGORY_FILTERS = [
  { value: 'all' as CategoryFilter, label: 'Todas' },
  ...(Object.keys(CATEGORY_FILTER_LABELS) as FeedbackCategory[]).map(category => ({
    value: category as CategoryFilter,
    label: CATEGORY_FILTER_LABELS[category],
    icon: CATEGORY_STYLES[category].icon,
    activeClassName: CATEGORY_STYLES[category].classes,
  })),
];

/** Empty-state copy that says what an empty list means for the active filters. */
function emptyCopy(status: StatusFilter, category: CategoryFilter) {
  if (category !== 'all') {
    return {
      title: 'Sin comentarios de este tipo',
      text: 'No hay comentarios de esta categoría con ese estado. Prueba con otro filtro.',
      icon: MessageSquare,
    };
  }
  if (status === 'OPEN') {
    return {
      title: 'Todo al día',
      text: 'No hay comentarios nuevos por revisar.',
      icon: CheckCircle2,
    };
  }
  if (status === 'IN_REVIEW') {
    return {
      title: 'Nada en revisión',
      text: 'Ningún comentario está en revisión ahora.',
      icon: MessageSquare,
    };
  }
  if (status === 'RESOLVED') {
    return {
      title: 'Aún no hay resueltos',
      text: 'Los comentarios que marques como resueltos aparecerán aquí.',
      icon: MessageSquare,
    };
  }
  return {
    title: 'Sin comentarios',
    text: 'Todavía nadie ha enviado comentarios.',
    icon: MessageSquare,
  };
}

/**
 * Admin window to read all feedback, set its status and reply with notes.
 */
export function AdminFeedbackPage() {
  const [status, setStatus] = useState<StatusFilter>('OPEN');
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
  const headerRef = useRef<HTMLElement>(null);

  // Cards with unsaved edits report here, so changing page or filter can ask first.
  const dirtyIds = useRef(new Set<string>());
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const handleDirtyChange = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyIds.current.add(id);
    else dirtyIds.current.delete(id);
  }, []);
  const guardNavigation = useCallback((navigate: () => void) => {
    if (dirtyIds.current.size > 0) setPendingNav(() => navigate);
    else navigate();
  }, []);
  const goToPage = useCallback(
    (next: number) =>
      guardNavigation(() => {
        setPage(next);
        headerRef.current?.scrollIntoView({ block: 'start' });
      }),
    [guardNavigation, setPage],
  );
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

  const empty = emptyCopy(status, category);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-8 pb-24">
      <header ref={headerRef}>
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
          balanced
          onChange={next => guardNavigation(() => setStatus(next))}
        />
        <FilterChips
          label="Filtrar por categoría"
          options={CATEGORY_FILTERS}
          value={category}
          balanced
          onChange={next => guardNavigation(() => setCategory(next))}
        />
      </div>

      <SectionState
        status={loadState}
        errorMessage={errorMessage}
        onRetry={() => void load()}
        isEmpty={items.length === 0}
        loadingText="Cargando comentarios…"
        errorTitle="No se pudieron cargar los comentarios"
        emptyIcon={empty.icon}
        emptyTitle={empty.title}
        emptyText={empty.text}
      >
        <ul
          aria-label="Comentarios"
          aria-busy={refreshing}
          className={cn('flex flex-col gap-3 transition-opacity', refreshing && 'opacity-60')}
        >
          {items.map(item => (
            <AdminFeedbackCard
              key={item.id}
              item={item}
              onUpdated={handleUpdated}
              onDirtyChange={handleDirtyChange}
            />
          ))}
        </ul>
      </SectionState>

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} label="comentarios" />

      <ConfirmActionDialog
        open={pendingNav !== null}
        onOpenChange={open => {
          if (!open) setPendingNav(null);
        }}
        title="¿Descartar cambios sin guardar?"
        description="Tienes respuestas o estados editados que no has guardado. Si continúas, se perderán."
        confirmLabel="Descartar y continuar"
        pendingLabel="Continuando…"
        destructive
        action={() => Promise.resolve()}
        fallbackError="No se pudo continuar."
        onDone={() => {
          dirtyIds.current.clear();
          pendingNav?.();
          setPendingNav(null);
        }}
      />
    </div>
  );
}

export default AdminFeedbackPage;
