import { useEffect } from 'react';
import type { ToastState } from '@/hooks/use-store';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ToastNotificationProps {
  toast: ToastState | null;
  onDismiss: () => void;
  durationMs?: number;
}

export function ToastNotification({
  toast,
  onDismiss,
  durationMs = 4000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [toast, onDismiss, durationMs]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-20 right-4 left-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 duration-300 md:bottom-8 md:left-auto">
      <div
        className={`flex items-start gap-3 rounded-2xl p-4 shadow-lg border backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-700 dark:text-emerald-100'
            : isError
            ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/90 dark:border-amber-700 dark:text-amber-100'
            : 'bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-950/90 dark:border-sky-700 dark:text-sky-100'
        }`}
      >
        <div className="shrink-0 pt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          ) : isError ? (
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Info className="size-5 text-sky-600 dark:text-sky-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-bold">{toast.title}</h5>
          <p className="mt-0.5 text-xs opacity-90">{toast.description}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
