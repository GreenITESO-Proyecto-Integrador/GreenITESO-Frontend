import { Link } from 'react-router-dom';
import { CheckCheck, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime } from '@/lib/utils';
import { NOTIFICATION_TYPE_META } from '@/components/shared/notification-type-meta';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
}

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const { icon: Icon, className: iconClassName } = NOTIFICATION_TYPE_META[notification.type];

  return (
    <Card
      className={cn(
        'relative gap-0 rounded-xl bg-card py-0 shadow-sm ring-1 ring-border',
        !notification.read && 'ring-primary-200 dark:ring-primary-800',
        notification.href && 'transition-colors hover:bg-muted/50',
      )}
    >
      <CardContent className="flex items-start gap-3 p-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            iconClassName,
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {notification.href ? (
              // The link's ::after covers the whole card, so the card is one click target.
              <Link
                to={notification.href}
                onClick={() => onMarkRead?.(notification)}
                className="text-sm font-semibold text-foreground outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary-500"
              >
                {notification.title}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-foreground">{notification.title}</p>
            )}
            {!notification.read ? (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500" aria-hidden />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </p>
            <div className="flex items-center gap-1">
              {!notification.read && onMarkRead ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative z-10 gap-1 text-primary-700 dark:text-primary-300"
                  onClick={() => onMarkRead(notification)}
                >
                  <CheckCheck />
                  Marcar como leída
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative z-10 text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar notificación"
                  onClick={() => onDelete(notification)}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
