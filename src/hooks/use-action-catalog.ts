import { useCallback, useEffect, useState } from 'react';
import { fetchActionCatalog } from '@/lib/api/action-catalog';
import type { CatalogAction } from '@/types/action-catalog';

export type ActionCatalogStatus = 'loading' | 'success' | 'error';

/**
 * Load the action catalog from the API and expose loading, success, and error states.
 */
export function useActionCatalog() {
  const [actions, setActions] = useState<CatalogAction[]>([]);
  const [status, setStatus] = useState<ActionCatalogStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetch the catalog again after an error or when the user retries.
   */
  const loadCatalog = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const catalog = await fetchActionCatalog();
      setActions(catalog);
      setStatus('success');
    } catch (error) {
      setActions([]);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load action catalog');
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return { actions, status, errorMessage, reload: loadCatalog };
}
