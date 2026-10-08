import { useCallback, useRef, useState } from 'react';
import { toFriendlyMessage } from '@/lib/api/errors';

/**
 * Run one clan mutation at a time and keep its busy / error state.
 * `run` resolves to true when the action succeeded, and to false when it failed or was ignored
 * because another call is still running (a ref guards against a fast double click, which can
 * fire before React re-renders the button as disabled).
 */
export function useClanAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const run = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      setError(toFriendlyMessage(caught, fallback));
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, run, clearError };
}
