import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionStateProps {
  status: 'loading' | 'success' | 'error';
  errorMessage: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  loadingText: string;
  errorTitle: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyText: string;
  children: ReactNode;
}

/**
 * Loading, error and empty states for a section, in the AuditReview style.
 * Renders `children` only when there is data to show.
 */
export function SectionState({
  status,
  errorMessage,
  onRetry,
  isEmpty,
  loadingText,
  errorTitle,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyText,
  children,
}: SectionStateProps) {
  if (status === 'loading') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {loadingText}
      </p>
    );
  }

  if (status === 'error') {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="text-lg font-semibold">{errorTitle}</h3>
        <p className="mt-2 text-sm">Intenta de nuevo cuando el servicio esté disponible.</p>
        {errorMessage ? <p className="mt-2 text-xs text-red-600">{errorMessage}</p> : null}
        <Button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          Reintentar
        </Button>
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center dark:border-sky-800 dark:bg-sky-900/30">
        <EmptyIcon className="mx-auto mb-4 size-10 text-sky-700 dark:text-sky-300" />
        <h3 className="text-lg font-semibold text-sky-800 dark:text-sky-200">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-sky-700 dark:text-sky-300">{emptyText}</p>
      </section>
    );
  }

  return <>{children}</>;
}
