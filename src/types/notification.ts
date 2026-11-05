/** Visual category used by the UI; several backend types map onto one category. */
export type NotificationType = 'MISSION' | 'AUDIT' | 'ACHIEVEMENT' | 'SOCIAL' | 'CLAN' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  /** In-app route to open when the notification is clicked; null when there is none. */
  href: string | null;
}

/** Notification types emitted by the backend (`notifications.models.NotificationType`). */
export type ApiNotificationType =
  | 'AUDIT_APPROVED'
  | 'AUDIT_REJECT'
  | 'BADGE_EARNED'
  | 'CAMPAIGN_APPROVED'
  | 'CAMPAIGN_FINISHED'
  | 'CAMPAIGN_INVITE'
  | 'CAMPAIGN_REJECTED'
  | 'CAMPAIGN_STARTED'
  | 'CLAN_DISSOLVED'
  | 'CLAN_JOIN_REQUEST'
  | 'CLAN_KICKED'
  | 'CLAN_LEADER_CHANGED'
  | 'CLAN_MEMBER_JOINED'
  | 'CLAN_MEMBER_LEFT'
  | 'CLAN_REQ_ACCEPTED'
  | 'CLAN_REQ_REJECTED'
  | 'MISSION_COMPLETED'
  | 'SOCIAL_FOLLOW'
  | 'SYSTEM';

/** Notification as serialized by the REST API and the WebSocket push. */
export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  notification_type: ApiNotificationType | string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  results: ApiNotification[];
  unread_count: number;
  count: number;
  /** URL of the next page, DRF-style; null/absent on the last page. */
  next?: string | null;
}
