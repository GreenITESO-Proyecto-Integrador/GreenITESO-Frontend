import { useContext } from 'react';
import { GuidedTourContext } from '@/components/onboarding/guided-tour-context';
import type { GuidedTourContextValue } from '@/components/onboarding/guided-tour-context';

export function useGuidedTour(): GuidedTourContextValue {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTour must be used within GuidedTourProvider');
  }
  return context;
}
