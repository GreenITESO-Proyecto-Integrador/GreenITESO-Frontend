import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import type { ClanPrivacy } from '@/types/clan';

/** Backend keys shown under a specific field; anything else goes in the general error. */
const FIELD_KEYS = ['name', 'description', 'privacy'];

export interface ClanFormValues {
  name: string;
  description: string;
  privacy: ClanPrivacy;
}

/**
 * Split a failed create or edit request into per-field messages and one general message.
 */
export function readClanFormError(
  error: unknown,
  fallback: string,
): { errors: Record<string, string>; submitError: string | null } {
  if (!(error instanceof ApiError)) {
    return { errors: {}, submitError: toFriendlyMessage(error, fallback) };
  }
  const entries = Object.entries(error.fieldErrors);
  const general = entries.find(([key]) => !FIELD_KEYS.includes(key));
  return {
    errors: Object.fromEntries(entries.filter(([key]) => FIELD_KEYS.includes(key))),
    submitError: general ? general[1] : entries.length === 0 ? error.message : null,
  };
}
