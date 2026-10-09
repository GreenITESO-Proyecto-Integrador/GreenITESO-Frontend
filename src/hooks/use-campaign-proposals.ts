import { useCallback, useEffect, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';
import { approveProposal, fetchProposals, rejectProposal } from '@/lib/api/campaigns';
import type { CampaignApprovalStatus } from '@/types/campaign';
import type { CampaignProposal } from '@/types/campaign-proposal';

export type CampaignProposalsStatus = 'loading' | 'success' | 'error';

/**
 * Load proposals for an approval filter and run admin approve/reject decisions.
 */
export function useCampaignProposals(filter?: CampaignApprovalStatus) {
  const [proposals, setProposals] = useState<CampaignProposal[]>([]);
  const [status, setStatus] = useState<CampaignProposalsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);

  /**
   * Fetch proposals again. `silent` keeps the list visible while refreshing.
   */
  const load = useCallback(
    async (silent = false) => {
      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;

      if (silent) {
        setRefreshing(true);
      } else {
        setStatus('loading');
        setDecisionError(null);
      }
      setErrorMessage(null);
      try {
        const result = await fetchProposals(filter);
        if (requestId !== latestRequest.current) return;
        setProposals(result);
        setStatus('success');
        hasLoaded.current = true;
        setRefreshing(false);
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        setProposals([]);
        setStatus('error');
        setRefreshing(false);
        setErrorMessage(toFriendlyMessage(error, 'No se pudieron cargar las propuestas.'));
      }
    },
    [filter],
  );

  // After the first load, changing the filter refreshes in place instead of blanking the list.
  useEffect(() => {
    void load(hasLoaded.current);
  }, [load]);

  async function decide(id: string, run: () => Promise<void>, fallback: string): Promise<boolean> {
    setBusyId(id);
    setDecisionError(null);
    try {
      await run();
      await load(true);
      return true;
    } catch (error) {
      setDecisionError(toFriendlyMessage(error, fallback));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Approve one proposal. Resolves true on success.
   */
  function approve(id: string): Promise<boolean> {
    return decide(id, () => approveProposal(id), 'No se pudo aprobar la propuesta.');
  }

  /**
   * Reject one proposal with a required reason. Resolves true on success.
   */
  async function reject(id: string, reason: string): Promise<boolean> {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setDecisionError('Indica el motivo del rechazo.');
      return false;
    }
    return decide(id, () => rejectProposal(id, trimmedReason), 'No se pudo rechazar la propuesta.');
  }

  const reload = useCallback(() => load(false), [load]);

  return {
    proposals,
    status,
    refreshing,
    errorMessage,
    decisionError,
    busyId,
    reload,
    approve,
    reject,
  };
}
