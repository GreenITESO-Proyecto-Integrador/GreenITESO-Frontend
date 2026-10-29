import { createContext } from 'react';

export interface GuidedTourContextValue {
  canReplay: boolean;
  startSimple: () => void;
  startCampaigns: () => void;
}

export const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);
