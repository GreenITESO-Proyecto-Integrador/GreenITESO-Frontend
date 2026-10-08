import { useCallback, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';

/**
 * Run one clan mutation at a time and keep its busy / error state.
 * `run` resolves to true when the action succeeded.
 */
export function useClanAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      setError(toFriendlyMessage(caught, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, run, clearError };
}
