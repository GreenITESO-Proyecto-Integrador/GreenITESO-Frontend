import { createContext } from 'react';

export interface GuidedTourContextValue {
  canReplaySimple: boolean;
  canReplayCampaigns: boolean;
  startSimple: () => void;
  startCampaigns: () => void;
}

export const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);
