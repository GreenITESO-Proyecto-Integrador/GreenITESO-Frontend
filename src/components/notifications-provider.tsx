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
  // Mirrors `notifications` synchronously so load()/markRead() can read the latest
  // list without waiting on React's state-update timing.
  const notificationsRef = useRef<Notification[]>([]);
  const requestSeqRef = useRef(0);

  const setNotificationsState = useCallback((next: Notification[]) => {
    notificationsRef.current = next;
    setNotifications(next);
  }, []);

  const replaceAll = useCallback(
    (items: Notification[], unread: number) => {
      knownIds.current = new Set(items.map(item => item.id));
      setNotificationsState(items);
      setUnreadCount(unread);
    },
    [setNotificationsState],
  );

  const load = useCallback(async () => {
    const requestId = ++requestSeqRef.current;
    try {
      const result = await getNotifications();
      // A newer load() already landed; this response is stale, so drop it.
      if (requestId !== requestSeqRef.current) return;

      const fetchedIds = new Set(result.notifications.map(item => item.id));
      // Notifications pushed over the socket while this GET was in flight aren't
      // in its response yet; keep them instead of letting replaceAll drop them.
      const missingFromFetch = notificationsRef.current.filter(item => !fetchedIds.has(item.id));
      const extraUnread = missingFromFetch.filter(item => !item.read).length;
      const merged = [...missingFromFetch, ...result.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      missingFromFetch.forEach(item => knownIds.current.add(item.id));
      fetchedIds.forEach(id => knownIds.current.add(id));
      setNotificationsState(merged);
      setUnreadCount(result.unreadCount + extraUnread);
      setHasError(false);
    } catch {
      if (requestId === requestSeqRef.current) setHasError(true);
    }
  }, [setNotificationsState]);

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
        setNotificationsState([notification, ...notificationsRef.current]);
        if (!notification.read) setUnreadCount(count => count + 1);
        setIncoming(notification);
      },
    });
  }, [hasStoredSession, load, replaceAll, setNotificationsState]);

  const markRead = useCallback(
    (notification: Notification) => {
      // The toast can hold a stale copy (read: false) of a notification already
      // marked read from the list; check the live state by id instead of trusting
      // the argument, so this transition - and the unreadCount decrement - only
      // happens once.
      const existing = notificationsRef.current.find(item => item.id === notification.id);
      if (!existing || existing.read) return;

      setNotificationsState(
        notificationsRef.current.map(item =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      setUnreadCount(count => Math.max(count - 1, 0));
      void markNotificationRead(notification.id).catch(() => load());
    },
    [load, setNotificationsState],
  );

  const markAllRead = useCallback(() => {
    setNotificationsState(notificationsRef.current.map(item => ({ ...item, read: true })));
    setUnreadCount(0);
    void markAllNotificationsRead().catch(() => load());
  }, [load, setNotificationsState]);

  const remove = useCallback(
    (notification: Notification) => {
      const existing = notificationsRef.current.find(item => item.id === notification.id);
      // The id stays in knownIds so a late push of the same notification is not re-added.
      setNotificationsState(notificationsRef.current.filter(item => item.id !== notification.id));
      if (existing && !existing.read) setUnreadCount(count => Math.max(count - 1, 0));
      void deleteNotification(notification.id).catch(() => load());
    },
    [load, setNotificationsState],
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
