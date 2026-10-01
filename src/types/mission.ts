export interface MissionAction {
  /** Backend does not expose the ActionMaster id in a mission; `code` is the stable key. */
  id: string;
  name: string;
}

export interface Mission {
  id: string;
  campaignId: string;
  action: MissionAction;
  targetCount: number;
  pointsReward: number;
}

export interface UserMissionProgress {
  missionId: string;
  currentCount: number;
  completed: boolean;
  targetCount: number;
}
