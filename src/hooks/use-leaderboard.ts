import { useCallback, useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import {
  LEADERBOARD_PAGE_SIZE,
  type LeaderboardEntry,
  type LeaderboardTab,
} from '@/types/leaderboard';

export type LeaderboardStatus = 'loading' | 'success' | 'error';

/**
 * Load one backend page of the ranking table (limit/offset) for the active tab.
 */
export function useLeaderboard() {
  const [tab, setTabState] = useState<LeaderboardTab>('global');
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<LeaderboardStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Switch ranking type and return to the first page so offset stays aligned.
   */
  const setTab = useCallback((next: LeaderboardTab) => {
    setTabState(next);
    setPage(1);
  }, []);

  /**
   * Fetch the current tab and page from the rankings API.
   */
  const loadLeaderboard = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const ranking = await fetchLeaderboard(tab, {
        limit: LEADERBOARD_PAGE_SIZE,
        offset: (page - 1) * LEADERBOARD_PAGE_SIZE,
      });
      setEntries(ranking.entries);
      setCount(ranking.count);
      setStatus('success');
    } catch (error) {
      setEntries([]);
      setCount(0);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load leaderboard');
    }
  }, [tab, page]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const totalPages = Math.max(1, Math.ceil(count / LEADERBOARD_PAGE_SIZE));

  return {
    tab,
    setTab,
    entries,
    count,
    page,
    totalPages,
    setPage,
    status,
    errorMessage,
    reload: loadLeaderboard,
  };
}
