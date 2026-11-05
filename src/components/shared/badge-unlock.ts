import type { Notification } from '@/types/notification';

/** BADGE_EARNED is the only backend type mapped to the ACHIEVEMENT category. */
export function isBadgeUnlock(notification: Notification): boolean {
  return notification.type === 'ACHIEVEMENT';
}

/**
 * Pulls the badge name out of the notification text. The backend template is
 * `Obtuviste la insignia "<name>".`; older rows say `Has obtenido el logro: <name>.`
 * Returns null when neither shape matches, so the modal shows generic copy.
 */
export function getBadgeName(message: string): string | null {
  const quoted = message.match(/"([^"]+)"/);
  if (quoted) return quoted[1]!;

  const legacy = message.match(/logro:\s*([^.]+)\./);
  return legacy ? legacy[1]!.trim() : null;
}
