export type ActionValidationType = 'NONE' | 'PHOTO';

export interface ActionCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
}

export interface CatalogAction {
  id: string;
  code: string;
  category: ActionCategory;
  name: string;
  description: string;
  points: number;
  dailyLimit: number;
  validationType: ActionValidationType;
  co2KgFactor: number;
  waterLitersFactor: number;
  plasticKgFactor: number;
  isActive: boolean;
}
