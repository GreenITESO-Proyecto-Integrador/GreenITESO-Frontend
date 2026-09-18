import { useCallback, useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardEntry, LeaderboardTab } from '@/types/leaderboard';

export type LeaderboardStatus = 'loading' | 'success' | 'error';

/**
 * Load the ranking table for the active tab from the Team 1 rankings API.
 */
export function useLeaderboard(tab: LeaderboardTab) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<LeaderboardStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetch the current tab's leaderboard again.
   */
  const loadLeaderboard = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const ranking = await fetchLeaderboard(tab);
      setEntries(ranking);
      setStatus('success');
    } catch (error) {
      setEntries([]);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load leaderboard');
    }
  }, [tab]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return { entries, status, errorMessage, reload: loadLeaderboard };
}
