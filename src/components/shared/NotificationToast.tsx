import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { NOTIFICATION_TYPE_META } from '@/components/shared/notification-type-meta';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notification';

const AUTO_DISMISS_MS = 6_000;

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss: () => void;
  onOpen: (notification: Notification) => void;
}

export function NotificationToast({ notification, onDismiss, onOpen }: NotificationToastProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const { icon: Icon, className: iconClassName } = NOTIFICATION_TYPE_META[notification.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 left-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl bg-card p-3 shadow-lg ring-1 ring-primary-200 sm:left-auto sm:mx-0 dark:ring-primary-800"
    >
      <Link
        to={notification.href ?? '/notifications'}
        onClick={() => {
          onOpen(notification);
          onDismiss();
        }}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            iconClassName,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
