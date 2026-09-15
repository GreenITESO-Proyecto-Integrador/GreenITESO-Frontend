import { useCallback, useEffect, useState } from 'react';
import { fetchActionCatalog } from '@/lib/api/action-catalog';
import { MOCK_CATALOG_ACTIONS } from '@/lib/api/action-catalog-mock';
import type { CatalogAction } from '@/types/action-catalog';

export type ActionCatalogStatus = 'loading' | 'success' | 'fallback';

export function useActionCatalog() {
  const [actions, setActions] = useState<CatalogAction[]>([]);
  const [status, setStatus] = useState<ActionCatalogStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const catalog = await fetchActionCatalog();
      setActions(catalog);
      setStatus('success');
    } catch (error) {
      setActions(MOCK_CATALOG_ACTIONS);
      setStatus('fallback');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load action catalog');
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return { actions, status, errorMessage, reload: loadCatalog };
}
