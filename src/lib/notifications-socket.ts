import { getApiBaseUrl } from '@/lib/api/client';
import { ensureAccessToken, refreshAccessToken } from '@/lib/auth/session';
import type { ApiNotification } from '@/types/notification';

const SOCKET_PATH = '/ws/notifications/';
const CLOSE_UNAUTHORIZED = 4401;
const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

interface NotificationsSocketHandlers {
  onNotification: (notification: ApiNotification) => void;
  /** Fired each time the socket authenticates, including after a reconnect. */
  onReady: (unreadCount: number) => void;
}

type ServerMessage =
  | { type: 'auth.ok'; unread_count: number }
  | { type: 'notification.created'; notification: ApiNotification }
  | { type: 'pong' };

export function getNotificationsSocketUrl(): string {
  return `${getApiBaseUrl().replace(/^http/, 'ws')}${SOCKET_PATH}`;
}

/**
 * Keeps one authenticated notifications socket open, reconnecting with
 * exponential backoff. The access token travels in the first frame rather than
 * the URL so it never lands in server logs. Returns a function that stops it.
 */
export function connectNotificationsSocket(handlers: NotificationsSocketHandlers): () => void {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = INITIAL_RETRY_MS;
  let stopped = false;
  // After a 4401 the client-side expiry check can't be trusted (clock skew, key
  // rotation), so the next attempt must ask the server for a fresh token.
  let forceRefresh = false;

  const scheduleReconnect = () => {
    if (stopped) return;
    retryTimer = setTimeout(() => void open(), retryDelay);
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
  };

  const open = async () => {
    let token: string | null;
    try {
      token = forceRefresh ? await refreshAccessToken() : await ensureAccessToken();
      forceRefresh = false;
    } catch {
      // Token refresh failed (e.g. network error): retry with backoff instead of
      // leaving the socket unconnected with no onclose to schedule a retry.
      scheduleReconnect();
      return;
    }
    if (stopped) return;
    if (!token) {
      scheduleReconnect();
      return;
    }

    const current = new WebSocket(getNotificationsSocketUrl());
    socket = current;

    current.onopen = () => current.send(JSON.stringify({ type: 'auth', token }));

    current.onmessage = event => {
      let message: ServerMessage;
      try {
        message = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        return;
      }

      if (message.type === 'auth.ok') {
        retryDelay = INITIAL_RETRY_MS;
        handlers.onReady(message.unread_count);
      } else if (message.type === 'notification.created') {
        handlers.onNotification(message.notification);
      }
    };

    current.onclose = event => {
      if (socket === current) socket = null;
      if (event.code === CLOSE_UNAUTHORIZED) forceRefresh = true;
      scheduleReconnect();
    };
  };

  void open();

  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
  };
}
