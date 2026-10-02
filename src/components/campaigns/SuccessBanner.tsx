import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessBannerProps {
  message: string;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 6000;

/**
 * Friendly success notice. Closes itself after a few seconds or on click.
 */
export function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-primary-700 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        aria-label="Cerrar aviso"
        onClick={onDismiss}
        className="-my-2 -mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:hover:bg-primary-900"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
