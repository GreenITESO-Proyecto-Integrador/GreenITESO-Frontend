import { useEffect, useState } from 'react';
import type { ActionLog, ActionLogStatus } from '@/types/action-logs';
import { fetchMyActionLogs } from '@/lib/api/action-logs';
import { toFriendlyMessage } from '@/lib/api/errors';

/**
 * Load the signed-in user's action logs. The backend applies the status filter.
 */
export const useMyActionLogs = (status?: ActionLogStatus) => {
  const [data, setData] = useState<ActionLog[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ignore a response that arrives after the filter changed again.
    let cancelled = false;

    const loadActionLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const logs = await fetchMyActionLogs(status);
        if (!cancelled) setData(logs);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(toFriendlyMessage(err, 'Error al cargar el historial de acciones'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadActionLogs();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return { data, loading, error };
};
