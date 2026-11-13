import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClanInvitations } from '@/lib/api/clans';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { ClanInvitation } from '@/types/clan';

export type ClanInvitationsStatus = 'loading' | 'success' | 'error';

/**
 * Load a clan's active invite codes (leader only). `add` and `remove` keep the list in step with
 * a code that was just generated or revoked, without another round trip.
 */
export function useClanInvitations(clanId: string) {
  const [invitations, setInvitations] = useState<ClanInvitation[]>([]);
  const [status, setStatus] = useState<ClanInvitationsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequest = useRef(0);

  // `silent` keeps the list on screen while it refreshes, instead of showing "Cargando…".
  const load = useCallback(
    async (silent = false) => {
      const requestId = ++latestRequest.current;
      if (!silent) setStatus('loading');
      setErrorMessage(null);
      try {
        const items = await fetchClanInvitations(clanId);
        if (requestId !== latestRequest.current) return;
        setInvitations(items);
        setStatus('success');
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        setInvitations([]);
        setStatus('error');
        setErrorMessage(toFriendlyMessage(error, 'No se pudieron cargar los códigos.'));
      }
    },
    [clanId],
  );

  useEffect(() => {
    void load();
    return () => {
      // Ignore a response that arrives after the clan changed or the dialog closed.
      latestRequest.current += 1;
    };
  }, [load]);

  // A load that started before the change would answer with a list that predates it.
  const add = useCallback((invitation: ClanInvitation) => {
    latestRequest.current += 1;
    setInvitations(current => [invitation, ...current]);
  }, []);

  const remove = useCallback((id: string) => {
    latestRequest.current += 1;
    setInvitations(current => current.filter(invitation => invitation.id !== id));
  }, []);

  return { invitations, status, errorMessage, reload: load, add, remove };
}
