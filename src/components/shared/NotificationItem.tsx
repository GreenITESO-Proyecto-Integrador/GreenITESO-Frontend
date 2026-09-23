import { Award, BellRing, CheckCheck, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (notification: Notification) => void;
}

const TYPE_META: Record<NotificationType, { icon: typeof BellRing; className: string }> = {
  MISSION: {
    icon: Sparkles,
    className: 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  },
  AUDIT: {
    icon: ShieldCheck,
    className: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  ACHIEVEMENT: {
    icon: Award,
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  SOCIAL: {
    icon: Users,
    className: 'bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  },
  SYSTEM: {
    icon: BellRing,
    className: 'bg-muted text-muted-foreground',
  },
};

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const { icon: Icon, className: iconClassName } = TYPE_META[notification.type];

  return (
    <Card
      className={cn(
        'gap-0 rounded-xl bg-card py-0 shadow-sm ring-1 ring-border',
        !notification.read && 'ring-primary-200 dark:ring-primary-800',
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
            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
            {!notification.read ? (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500" aria-hidden />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </p>
            {!notification.read && onMarkRead ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-primary-700 dark:text-primary-300"
                onClick={() => onMarkRead(notification)}
              >
                <CheckCheck />
                Marcar como leída
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
