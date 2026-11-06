import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminUsers } from '@/lib/api/admin-users';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { AdminUser, AdminUserFilter } from '@/types/admin-user';
import { useDebouncedValue } from './use-debounced-value';

export type AdminUsersStatus = 'loading' | 'success' | 'error';

/**
 * Accounts for the admin "Usuarios" window: filter, search (debounced) and page.
 * Changing the filter or the search goes back to page 1 and refreshes in place, so the
 * list is dimmed instead of blanked.
 */
export function useAdminUsers() {
  const [filter, setFilterState] = useState<AdminUserFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchInput.trim());

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<AdminUsersStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (silent: boolean) => {
      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;
      if (silent) setRefreshing(true);
      else setStatus('loading');
      setErrorMessage(null);
      try {
        const result = await fetchAdminUsers({ filter, search, page });
        if (requestId !== latestRequest.current) return;
        setUsers(result.users);
        setTotalPages(result.totalPages);
        setStatus('success');
        hasLoaded.current = true;
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        setUsers([]);
        setStatus('error');
        setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar la lista de usuarios.'));
      } finally {
        if (requestId === latestRequest.current) setRefreshing(false);
      }
    },
    [filter, search, page],
  );

  useEffect(() => {
    void load(hasLoaded.current);
  }, [load]);

  const setFilter = useCallback((next: AdminUserFilter) => {
    setFilterState(next);
    setPage(1);
  }, []);

  const setSearch = useCallback((next: string) => {
    setSearchInput(next);
    setPage(1);
  }, []);

  // After a ban or unban the list may shrink: leave an emptied page for the one before it.
  const reload = useCallback(async () => {
    if (filter !== 'all' && users.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    await load(true);
  }, [filter, load, page, users.length]);

  return {
    users,
    status,
    errorMessage,
    refreshing,
    filter,
    setFilter,
    searchInput,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    reload,
  };
}
