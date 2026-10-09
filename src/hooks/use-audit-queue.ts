import { useCallback, useEffect, useState } from 'react';
import { approveAuditLog, fetchPendingAuditLogs, rejectAuditLog } from '@/lib/api/action-audit';
import type { PendingAuditLog } from '@/types/action-audit';

export type AuditQueueStatus = 'loading' | 'success' | 'error';

/**
 * Load PENDING_AUDIT logs and run approve/reject decisions through the backend.
 */
export function useAuditQueue() {
  const [logs, setLogs] = useState<PendingAuditLog[]>([]);
  const [status, setStatus] = useState<AuditQueueStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [busyLogId, setBusyLogId] = useState<string | null>(null);

  /**
   * Fetch the pending audit queue again.
   */
  const loadQueue = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    setDecisionError(null);

    try {
      const pendingLogs = await fetchPendingAuditLogs();
      setLogs(pendingLogs);
      setStatus('success');
    } catch (error) {
      setLogs([]);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load audit queue');
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  /**
   * Approve one pending log and remove it from the local queue on success.
   */
  async function approveLog(logId: string) {
    setBusyLogId(logId);
    setDecisionError(null);

    try {
      await approveAuditLog(logId);
      setLogs(current => current.filter(log => log.id !== logId));
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : 'Unable to approve evidence');
    } finally {
      setBusyLogId(null);
    }
  }

  /**
   * Reject one pending log with a reason and remove it from the local queue on success.
   */
  async function rejectLog(logId: string, rejectionReason: string) {
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setDecisionError('Indica el motivo del rechazo.');
      return;
    }

    setBusyLogId(logId);
    setDecisionError(null);

    try {
      await rejectAuditLog(logId, trimmedReason);
      setLogs(current => current.filter(log => log.id !== logId));
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : 'Unable to reject evidence');
    } finally {
      setBusyLogId(null);
    }
  }

  return {
    logs,
    status,
    errorMessage,
    decisionError,
    busyLogId,
    reload: loadQueue,
    approveLog,
    rejectLog,
  };
}
