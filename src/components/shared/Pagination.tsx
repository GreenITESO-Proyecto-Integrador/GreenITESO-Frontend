import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Accessible name, e.g. "campañas". */
  label: string;
}

const ARROW_BUTTON_CLASS =
  'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none active:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-foreground dark:hover:border-primary-800 dark:hover:bg-primary-900/40 dark:hover:text-primary-300';

/**
 * Minimal pager: arrow buttons around a progress bar that fills as pages advance.
 * Renders nothing when there is a single page.
 */
export function Pagination({ page, totalPages, onPageChange, label }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={`Paginación de ${label}`} className="flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={ARROW_BUTTON_CLASS}
      >
        <ChevronLeft className="size-5" />
      </button>

      <div
        role="progressbar"
        aria-label={`Página de ${label}`}
        aria-valuemin={1}
        aria-valuemax={totalPages}
        aria-valuenow={page}
        aria-valuetext={`Página ${page} de ${totalPages}`}
        className="h-2 w-full max-w-48 flex-1 overflow-hidden rounded-full bg-secondary-100 dark:bg-white/25"
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300 dark:bg-primary-400"
          style={{ width: `${(page / totalPages) * 100}%` }}
        />
      </div>

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={ARROW_BUTTON_CLASS}
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}
