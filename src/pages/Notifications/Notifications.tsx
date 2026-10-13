import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/shared/NotificationItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationsPage() {
  const { notifications, unreadCount, isLoading, hasError, markRead, markAllRead, remove } =
    useNotifications();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {unreadCount > 0 ? `Tienes ${unreadCount} notificaciones sin leer.` : 'Estás al día.'}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllRead}>
            <CheckCheck className="size-4" />
            Marcar todo
          </Button>
        ) : null}
      </div>

      {hasError ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar las notificaciones.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {isLoading && notifications.length === 0
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))
          : notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markRead}
                onDelete={remove}
              />
            ))}

        {!isLoading && !hasError && notifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No tienes notificaciones.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default NotificationsPage;
