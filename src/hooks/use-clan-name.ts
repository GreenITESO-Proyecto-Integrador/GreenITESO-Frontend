import { useEffect, useState } from 'react';
import { fetchClans } from '@/lib/api/clans';

/**
 * Resolve a clan name from its id. Null while loading, when unknown, or on error.
 */
export function useClanName(clanId: string | null): string | null {
  const [resolved, setResolved] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!clanId) return;
    let cancelled = false;
    fetchClans()
      .then(clans => {
        const clan = clans.find(item => item.id === clanId);
        if (!cancelled && clan) setResolved({ id: clan.id, name: clan.name });
      })
      .catch(() => {
        // Name is cosmetic; the detail falls back to a generic label.
      });
    return () => {
      cancelled = true;
    };
  }, [clanId]);

  return clanId && resolved?.id === clanId ? resolved.name : null;
}
