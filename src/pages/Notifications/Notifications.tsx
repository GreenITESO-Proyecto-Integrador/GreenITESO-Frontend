import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/shared/NotificationItem';
import { mockNotifications } from '@/pages/Notifications/mock-data';
import type { Notification } from '@/types/notification';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const handleMarkRead = (notification: Notification) => {
    setNotifications(current =>
      current.map(item => (item.id === notification.id ? { ...item, read: true } : item)),
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(current => current.map(item => ({ ...item, read: true })));
  };

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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4" />
            Marcar todo
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
          />
        ))}

        {notifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No tienes notificaciones.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default NotificationsPage;
