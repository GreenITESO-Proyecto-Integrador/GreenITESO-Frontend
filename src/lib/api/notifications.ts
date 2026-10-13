import { apiFetch, getApiBaseUrl } from './client';
import type {
  ApiNotification,
  ApiNotificationType,
  Notification,
  NotificationListResponse,
  NotificationType,
} from '@/types/notification';

const API_TYPE_TO_CATEGORY: Record<ApiNotificationType, NotificationType> = {
  AUDIT_APPROVED: 'AUDIT',
  AUDIT_REJECT: 'AUDIT',
  BADGE_EARNED: 'ACHIEVEMENT',
  CAMPAIGN_INVITE: 'MISSION',
  MISSION_COMPLETED: 'MISSION',
  SOCIAL_FOLLOW: 'SOCIAL',
  SYSTEM: 'SYSTEM',
};

/**
 * Where each notification opens. Only types whose target page exists today have
 * a route; the rest just get marked as read. Change a destination here.
 */
const API_TYPE_TO_ROUTE: Partial<Record<ApiNotificationType, string>> = {
  AUDIT_APPROVED: '/leaderboard',
  AUDIT_REJECT: '/actions/register',
  CAMPAIGN_INVITE: '/missions',
  MISSION_COMPLETED: '/missions',
  SOCIAL_FOLLOW: '/feed',
};

export function mapApiNotification(notification: ApiNotification): Notification {
  return {
    id: notification.id,
    type: API_TYPE_TO_CATEGORY[notification.notification_type as ApiNotificationType] ?? 'SYSTEM',
    title: notification.title,
    message: notification.message,
    createdAt: notification.created_at,
    read: notification.is_read,
    href: API_TYPE_TO_ROUTE[notification.notification_type as ApiNotificationType] ?? null,
  };
}

/** Turns a DRF `next` URL into a same-origin path apiFetch can prefix with the API base. */
function toApiPath(nextUrl: string): string {
  const { pathname, search } = new URL(nextUrl, getApiBaseUrl());
  return `${pathname}${search}`;
}

const NOTIFICATIONS_PATH = '/api/v1/notifications/';
const MAX_WALK_RESTARTS = 3;

/**
 * Walks every page so older notifications beyond the first 50 stay reachable.
 * DRF's pagination is offset-based, so a row created or deleted while this is
 * paginating shifts every later page: an insert repeats a row (dropped by the
 * id dedupe) and a delete skips one. `count` changing between pages reveals
 * either, so the walk restarts from page 1 (a few times at most). The per-page
 * `unread_count` is a point-in-time snapshot that can race the same insert,
 * so callers should count unread from the returned list instead.
 */
export async function getNotifications(): Promise<{ notifications: Notification[] }> {
  const notifications: Notification[] = [];
  const seenIds = new Set<string>();
  let path: string | null = NOTIFICATIONS_PATH;
  let expectedCount: number | null = null;
  let restarts = 0;

  while (path) {
    const response: Response = await apiFetch(path);
    if (!response.ok) throw new Error('Fallo al obtener las notificaciones');

    const payload = (await response.json()) as NotificationListResponse;
    if (expectedCount !== null && payload.count !== expectedCount && restarts < MAX_WALK_RESTARTS) {
      restarts += 1;
      notifications.length = 0;
      seenIds.clear();
      expectedCount = null;
      path = NOTIFICATIONS_PATH;
      continue;
    }
    expectedCount = payload.count;

    for (const apiNotification of payload.results) {
      if (seenIds.has(apiNotification.id)) continue;
      seenIds.add(apiNotification.id);
      notifications.push(mapApiNotification(apiNotification));
    }
    path = payload.next ? toApiPath(payload.next) : null;
  }

  return { notifications };
}

export async function markNotificationRead(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/notifications/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_read: true }),
  });
  if (!response.ok) throw new Error('No se pudo marcar la notificación como leída');
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await apiFetch('/api/v1/notifications/mark-all-read/', { method: 'PATCH' });
  if (!response.ok) throw new Error('No se pudieron marcar las notificaciones como leídas');
}

export async function deleteNotification(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/notifications/${id}/`, { method: 'DELETE' });
  if (!response.ok) throw new Error('No se pudo eliminar la notificación');
}
