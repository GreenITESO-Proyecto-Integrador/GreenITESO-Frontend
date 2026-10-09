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

type NotificationEvent =
  | { type: 'add'; id: string; notification: Notification }
  | { type: 'read'; id: string }
  | { type: 'remove'; id: string };

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
  // Every load() in flight registers a log here; local mutations (push, read,
  // delete) append to every open log so that log can be replayed on top of that
  // request's response instead of diffing stale snapshots.
  const activeLoadLogsRef = useRef(new Set<NotificationEvent[]>());
  // Optimistic read/delete events whose PATCH/DELETE hasn't settled yet. A load()
  // that starts while one is pending may get a response that predates the write,
  // so every load() log is seeded with these and replays them over its response.
  const pendingWritesRef = useRef(new Set<NotificationEvent>());

  const setNotificationsState = useCallback((next: Notification[]) => {
    notificationsRef.current = next;
    setNotifications(next);
  }, []);

  const recordEvent = useCallback((event: NotificationEvent) => {
    activeLoadLogsRef.current.forEach(log => log.push(event));
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
    const log: NotificationEvent[] = [...pendingWritesRef.current];
    activeLoadLogsRef.current.add(log);
    try {
      const result = await getNotifications();
      // A newer load() already landed; this response is stale, so drop it.
      if (requestId !== requestSeqRef.current) return;

      // Replay what happened locally since this request started on top of the
      // server's response, instead of diffing it against the (now stale) local
      // list. This lets the server drop items removed by another session, while
      // mutations made here during the request (a read, a delete, a push) still
      // apply even though they predate the response.
      let items = result.notifications;
      for (const event of log) {
        const index = items.findIndex(item => item.id === event.id);
        if (event.type === 'add') {
          if (index !== -1) continue;
          items = [event.notification, ...items];
        } else if (event.type === 'read') {
          if (index === -1 || items[index]!.read) continue;
          items = items.map((item, i) => (i === index ? { ...item, read: true } : item));
        } else if (event.type === 'remove') {
          if (index === -1) continue;
          items = items.filter((_, i) => i !== index);
        }
      }
      items = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      // Derived from this final, deduped list rather than the API's unread_count:
      // that count is a snapshot of whichever page it came from, and can race a
      // notification created mid-pagination (counted there, replayed here too).
      const unread = items.filter(item => !item.read).length;

      knownIds.current = new Set(items.map(item => item.id));
      setNotificationsState(items);
      setUnreadCount(unread);
      setHasError(false);
    } catch {
      if (requestId === requestSeqRef.current) setHasError(true);
    } finally {
      activeLoadLogsRef.current.delete(log);
    }
  }, [setNotificationsState]);

  const trackWrite = useCallback(
    (events: NotificationEvent[], write: Promise<void>) => {
      events.forEach(event => {
        pendingWritesRef.current.add(event);
        recordEvent(event);
      });
      const settle = () => events.forEach(event => pendingWritesRef.current.delete(event));
      // On failure the server state wins: drop the pending events, then reload.
      void write.then(settle, () => {
        settle();
        void load();
      });
    },
    [load, recordEvent],
  );

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
        recordEvent({ type: 'add', id: notification.id, notification });
      },
    });
  }, [hasStoredSession, load, recordEvent, replaceAll, setNotificationsState]);

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
      trackWrite([{ type: 'read', id: notification.id }], markNotificationRead(notification.id));
    },
    [setNotificationsState, trackWrite],
  );

  const markAllRead = useCallback(() => {
    const events = notificationsRef.current
      .filter(item => !item.read)
      .map((item): NotificationEvent => ({ type: 'read', id: item.id }));
    setNotificationsState(notificationsRef.current.map(item => ({ ...item, read: true })));
    setUnreadCount(0);
    trackWrite(events, markAllNotificationsRead());
  }, [setNotificationsState, trackWrite]);

  const remove = useCallback(
    (notification: Notification) => {
      const existing = notificationsRef.current.find(item => item.id === notification.id);
      // The id stays in knownIds so a late push of the same notification is not re-added.
      setNotificationsState(notificationsRef.current.filter(item => item.id !== notification.id));
      if (existing && !existing.read) setUnreadCount(count => Math.max(count - 1, 0));
      trackWrite([{ type: 'remove', id: notification.id }], deleteNotification(notification.id));
    },
    [setNotificationsState, trackWrite],
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
