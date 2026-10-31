import { useContext } from 'react';
import { GuidedTourContext } from '@/components/onboarding/guided-tour-context';
import type { GuidedTourContextValue } from '@/components/onboarding/guided-tour-context';

export function useGuidedTour(): GuidedTourContextValue {
  return useContext(GuidedTourContext);
}
