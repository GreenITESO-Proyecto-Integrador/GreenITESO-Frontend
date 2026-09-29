export type NotificationType = 'MISSION' | 'AUDIT' | 'ACHIEVEMENT' | 'SOCIAL' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
