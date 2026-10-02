import { createContext } from 'react';
import type { Notification } from '@/types/notification';

export interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasError: boolean;
  /** Most recent notification pushed over the socket, for the toast. */
  incoming: Notification | null;
  dismissIncoming: () => void;
  markRead: (notification: Notification) => void;
  markAllRead: () => void;
  remove: (notification: Notification) => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);
