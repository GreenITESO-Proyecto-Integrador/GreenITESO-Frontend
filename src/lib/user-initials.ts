import { getInitials } from '@/lib/clan-meta';

/**
 * Initials shown when a user has no photo. A name gives up to two letters
 * ("Mariana García" → "MG"); when only an email is known, its first letter is
 * used, so "ana@iteso.mx" shows "A" instead of letters from the address.
 */
export function getUserInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.includes('@') && !/\s/.test(trimmed)) {
    return trimmed[0]?.toUpperCase() ?? '?';
  }
  return getInitials(trimmed);
}
