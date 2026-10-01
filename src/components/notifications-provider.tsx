import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NotificationToast } from '@/components/shared/NotificationToast';
import {
  deleteNotification,
  getNotifications,
  mapApiNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { getAccessToken, getRefreshToken } from '@/lib/auth/session';
import { NotificationsContext } from '@/lib/notifications-context';
import { connectNotificationsSocket } from '@/lib/notifications-socket';
import type { Notification } from '@/types/notification';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // Re-render on navigation so a login or logout is picked up without a reload.
  useLocation();
  const hasStoredSession = Boolean(getAccessToken() || getRefreshToken());

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [incoming, setIncoming] = useState<Notification | null>(null);
  const knownIds = useRef(new Set<string>());

  const replaceAll = useCallback((items: Notification[], unread: number) => {
    knownIds.current = new Set(items.map(item => item.id));
    setNotifications(items);
    setUnreadCount(unread);
  }, []);

  const load = useCallback(async () => {
    try {
      const result = await getNotifications();
      replaceAll(result.notifications, result.unreadCount);
      setHasError(false);
    } catch {
      setHasError(true);
    }
  }, [replaceAll]);

  useEffect(() => {
    if (!hasStoredSession) {
      replaceAll([], 0);
      setIncoming(null);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    void load().finally(() => setIsLoading(false));

    return connectNotificationsSocket({
      // Reload on every (re)connect so anything missed while offline shows up.
      onReady: () => void load(),
      onNotification: apiNotification => {
        const notification = mapApiNotification(apiNotification);
        if (knownIds.current.has(notification.id)) return;

        knownIds.current.add(notification.id);
        setNotifications(current => [notification, ...current]);
        if (!notification.read) setUnreadCount(count => count + 1);
        setIncoming(notification);
      },
    });
  }, [hasStoredSession, load, replaceAll]);

  const markRead = useCallback(
    (notification: Notification) => {
      if (notification.read) return;
      setNotifications(current =>
        current.map(item => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      setUnreadCount(count => Math.max(count - 1, 0));
      void markNotificationRead(notification.id).catch(() => load());
    },
    [load],
  );

  const markAllRead = useCallback(() => {
    setNotifications(current => current.map(item => ({ ...item, read: true })));
    setUnreadCount(0);
    void markAllNotificationsRead().catch(() => load());
  }, [load]);

  const remove = useCallback(
    (notification: Notification) => {
      // The id stays in knownIds so a late push of the same notification is not re-added.
      setNotifications(current => current.filter(item => item.id !== notification.id));
      if (!notification.read) setUnreadCount(count => Math.max(count - 1, 0));
      void deleteNotification(notification.id).catch(() => load());
    },
    [load],
  );

  const dismissIncoming = useCallback(() => setIncoming(null), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      hasError,
      incoming,
      dismissIncoming,
      markRead,
      markAllRead,
      remove,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      hasError,
      incoming,
      dismissIncoming,
      markRead,
      markAllRead,
      remove,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationToast notification={incoming} onDismiss={dismissIncoming} onOpen={markRead} />
    </NotificationsContext.Provider>
  );
}
