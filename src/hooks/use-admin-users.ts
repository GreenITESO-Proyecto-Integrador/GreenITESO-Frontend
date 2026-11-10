import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminUsers } from '@/lib/api/admin-users';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import type { AdminUser, AdminUserFilter } from '@/types/admin-user';
import { useDebouncedValue } from './use-debounced-value';

export type AdminUsersStatus = 'loading' | 'success' | 'error';

/**
 * Accounts for the admin "Usuarios" window: filter, search (debounced) and page.
 * A new filter or search starts again at page 1 and refreshes in place, so the list is dimmed
 * instead of blanked. After an error, retrying shows "Cargando…" again.
 */
export function useAdminUsers() {
  const [filter, setFilterState] = useState<AdminUserFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim());

  // The page belongs to the query it was chosen for: another filter or search is page 1 again,
  // and only once the debounced search is applied, so no request goes out for the old text.
  const queryKey = `${filter}|${search}`;
  const [chosen, setChosen] = useState({ key: queryKey, page: 1 });
  const page = chosen.key === queryKey ? chosen.page : 1;
  const setPage = useCallback(
    (next: number) => setChosen({ key: queryKey, page: next }),
    [queryKey],
  );

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<AdminUsersStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);
  const statusRef = useRef<AdminUsersStatus>('loading');

  const changeStatus = useCallback((next: AdminUsersStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const load = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    // Keep the list on screen while it refreshes, except after an error or on the first load.
    if (statusRef.current === 'success') setRefreshing(true);
    else changeStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchAdminUsers({ filter, search, page });
      if (requestId !== latestRequest.current) return;
      setUsers(result.users);
      setTotalPages(result.totalPages);
      changeStatus('success');
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      if (error instanceof ApiError && error.status === 404 && page > 1) {
        // The list shrank and this page no longer exists: step back to the one before.
        setPage(page - 1);
        return;
      }
      setUsers([]);
      changeStatus('error');
      setErrorMessage(toFriendlyMessage(error, 'No se pudo cargar la lista de usuarios.'));
    } finally {
      if (requestId === latestRequest.current) setRefreshing(false);
    }
  }, [filter, search, page, changeStatus, setPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = useCallback((next: AdminUserFilter) => setFilterState(next), []);

  return {
    users,
    status,
    errorMessage,
    refreshing,
    filter,
    setFilter,
    searchInput,
    search,
    setSearch: setSearchInput,
    page,
    setPage,
    totalPages,
    reload: load,
  };
}
