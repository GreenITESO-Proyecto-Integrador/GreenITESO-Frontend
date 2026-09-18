export type LeaderboardTab = 'global' | 'teams';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  totalPoints: number;
}
