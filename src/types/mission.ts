export interface MissionAction {
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
  currentCount: number;
  completed: boolean;
}
