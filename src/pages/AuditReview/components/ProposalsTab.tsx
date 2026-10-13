import { useCallback, useState } from 'react';
import { ProposalList, type ProposalFilter } from '@/components/campaigns/ProposalList';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';
import { useCampaignProposals } from '@/hooks/use-campaign-proposals';

/**
 * Campaign proposals audit: admins approve or reject (with a reason) each proposal.
 */
export function ProposalsTab() {
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('PENDING');
  const proposalsData = useCampaignProposals(proposalFilter === 'ALL' ? undefined : proposalFilter);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  async function handleApprove(id: string) {
    if (await proposalsData.approve(id)) {
      setNotice('Propuesta aprobada. Ya es una campaña disponible para la comunidad.');
    }
  }

  async function handleReject(id: string, reason: string) {
    if (await proposalsData.reject(id, reason)) {
      setNotice('Propuesta rechazada. El motivo quedó visible para quien la envió.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-secondary-300 sm:text-base">
        Campañas propuestas por la comunidad. Al aprobar una, se publica como campaña global.
      </p>
      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}
      <ProposalList
        proposals={proposalsData.proposals}
        status={proposalsData.status}
        refreshing={proposalsData.refreshing}
        errorMessage={proposalsData.errorMessage}
        onRetry={() => void proposalsData.reload()}
        isAdmin
        filter={proposalFilter}
        onFilterChange={setProposalFilter}
        busyId={proposalsData.busyId}
        decisionError={proposalsData.decisionError}
        onApprove={id => void handleApprove(id)}
        onReject={(id, reason) => void handleReject(id, reason)}
      />
    </div>
  );
}
