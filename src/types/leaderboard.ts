export type LeaderboardTab = 'global' | 'institutional' | 'private_clan';

export const LEADERBOARD_PAGE_SIZE = 50;

export interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  totalPoints: number;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  count: number;
  limit: number;
  offset: number;
}

/**
 * Clan ranking tabs use GET /api/v1/rankings/?type= from backend PR #140.
 */
export function isClanLeaderboardTab(tab: LeaderboardTab): boolean {
  return tab === 'institutional' || tab === 'private_clan';
}
