import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACTIONS, EVENTS, STATUS, type EventData, Joyride } from 'react-joyride';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GuidedTourContext } from '@/components/onboarding/guided-tour-context';
import { CAMPAIGN_STEPS, SIMPLE_STEPS, type TourStep } from './guided-tour-steps';

const TOUR_STORAGE_PREFIX = 'greeniteso.guided-tour.';
const TOUR_INTERRUPTION_SUFFIX = '.interrupted';

type TourPhase = 'simple' | 'campaigns';
type TourStatus = 'completed' | 'skipped';

function getTourStorageKey(userId: string, phase: TourPhase): string {
  return `${TOUR_STORAGE_PREFIX}${userId}.${phase}`;
}

function getStoredTourStatus(userId: string, phase: TourPhase): TourStatus | null {
  if (!userId) return null;

  try {
    const value = localStorage.getItem(getTourStorageKey(userId, phase));
    return value === 'completed' || value === 'skipped' ? value : null;
  } catch {
    return null;
  }
}

function setStoredTourStatus(userId: string, phase: TourPhase, status: TourStatus): void {
  try {
    localStorage.setItem(getTourStorageKey(userId, phase), status);
  } catch {
    // Keep the tour usable when browser storage is blocked.
  }
}

function getSessionInterruptionKey(userId: string): string {
  return `${TOUR_STORAGE_PREFIX}${userId}${TOUR_INTERRUPTION_SUFFIX}`;
}

function hasSessionInterruption(userId: string): boolean {
  if (!userId) return false;

  try {
    return sessionStorage.getItem(getSessionInterruptionKey(userId)) === 'true';
  } catch {
    return false;
  }
}

function setSessionInterruption(userId: string): void {
  try {
    sessionStorage.setItem(getSessionInterruptionKey(userId), 'true');
  } catch {
    // Keep the tour usable when browser storage is blocked.
  }
}

export function GuidedTourProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const { user, isAdmin } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<TourPhase | null>(null);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoLaunchSuppressed, setAutoLaunchSuppressed] = useState(false);
  const navigatingToRouteRef = useRef<string | null>(null);
  const currentPathnameRef = useRef(location.pathname);
  const navigateRef = useRef(navigate);

  const userId = user?.id ?? '';
  const simpleStatus = userId ? getStoredTourStatus(userId, 'simple') : null;
  const campaignsStatus = userId ? getStoredTourStatus(userId, 'campaigns') : null;
  const steps = phase === 'campaigns' ? CAMPAIGN_STEPS : SIMPLE_STEPS;
  const activeStep: TourStep | null = phase ? (steps[stepIndex] ?? null) : null;

  useEffect(() => {
    currentPathnameRef.current = location.pathname;
  }, [location.pathname]);

  navigateRef.current = navigate;

  useEffect(() => {
    setAutoLaunchSuppressed(userId ? hasSessionInterruption(userId) : false);
  }, [userId]);

  const finishTour = useCallback(
    (status: TourStatus) => {
      if (!userId || !phase) {
        setRun(false);
        setPhase(null);
        return;
      }

      setStoredTourStatus(userId, phase, status);
      setRun(false);
      navigatingToRouteRef.current = null;

      if (phase === 'simple' && status === 'completed' && !campaignsStatus) {
        navigatingToRouteRef.current = CAMPAIGN_STEPS[0].route;
        setPhase('campaigns');
        setStepIndex(0);
        return;
      }

      setPhase(null);
    },
    [campaignsStatus, phase, userId],
  );

  useEffect(() => {
    if (
      !enabled ||
      isAdmin ||
      !userId ||
      simpleStatus ||
      autoLaunchSuppressed ||
      hasSessionInterruption(userId)
    ) {
      return;
    }

    navigatingToRouteRef.current = SIMPLE_STEPS[0].route;
    setPhase('simple');
    setStepIndex(0);
  }, [autoLaunchSuppressed, enabled, isAdmin, simpleStatus, userId]);

  const stopTour = useCallback(() => {
    setRun(false);
    setPhase(null);
    setAutoLaunchSuppressed(true);
    setSessionInterruption(userId);
    navigatingToRouteRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (!phase || !activeStep || !enabled || isAdmin) {
      setRun(false);
      return;
    }

    if (currentPathnameRef.current === activeStep.route) {
      const timer = window.setTimeout(() => setRun(true), 0);
      return () => window.clearTimeout(timer);
    }

    if (navigatingToRouteRef.current !== activeStep.route) {
      return;
    }

    setRun(false);
    navigateRef.current(activeStep.route);
  }, [activeStep, enabled, isAdmin, phase]);

  useEffect(() => {
    if (!phase || !activeStep || !enabled || isAdmin) {
      return;
    }

    if (location.pathname === activeStep.route && navigatingToRouteRef.current) {
      navigatingToRouteRef.current = null;
      setRun(true);
      return;
    }

    if (run && !navigatingToRouteRef.current && location.pathname !== activeStep.route) {
      stopTour();
    }
  }, [activeStep, enabled, isAdmin, location.pathname, phase, run, stopTour]);

  function handleEvent(data: EventData) {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED) {
      finishTour('completed');
      return;
    }

    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      finishTour('skipped');
      return;
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      stopTour();
      return;
    }

    if (type !== EVENTS.STEP_AFTER) {
      return;
    }

    if (action === ACTIONS.PREV) {
      const nextIndex = Math.max(0, index - 1);
      navigatingToRouteRef.current = steps[nextIndex].route;
      setStepIndex(nextIndex);
      return;
    }

    if (action === ACTIONS.NEXT) {
      if (index + 1 >= steps.length) {
        finishTour('completed');
      } else {
        const nextIndex = index + 1;
        navigatingToRouteRef.current = steps[nextIndex].route;
        setStepIndex(nextIndex);
      }
    }
  }

  const startTour = useCallback(
    (nextPhase: TourPhase) => {
      if (!enabled || isAdmin || !userId) {
        return;
      }

      navigatingToRouteRef.current = (
        nextPhase === 'campaigns' ? CAMPAIGN_STEPS : SIMPLE_STEPS
      )[0].route;
      setAutoLaunchSuppressed(false);
      setPhase(nextPhase);
      setStepIndex(0);
      setRun(false);
    },
    [enabled, isAdmin, userId],
  );

  const canReplay = enabled && !isAdmin && Boolean(userId);
  const contextValue = useMemo(
    () => ({
      canReplay,
      startSimple: () => startTour('simple'),
      startCampaigns: () => startTour('campaigns'),
    }),
    [canReplay, startTour],
  );

  return (
    <GuidedTourContext.Provider value={contextValue}>
      {children}
      {!isAdmin && enabled && phase && activeStep ? (
        <Joyride
          continuous
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            nextWithProgress: 'Siguiente ({current} de {total})',
            skip: 'Saltar',
          }}
          onEvent={handleEvent}
          options={{
            arrowColor: 'var(--color-card)',
            backgroundColor: 'var(--color-card)',
            overlayClickAction: 'close',
            primaryColor: 'var(--color-primary-500)',
            skipBeacon: true,
            showProgress: true,
            targetWaitTimeout: 5000,
            textColor: 'var(--color-foreground)',
            zIndex: 60,
            buttons: ['back', 'close', 'primary', 'skip'],
          }}
          run={run}
          scrollToFirstStep
          stepIndex={stepIndex}
          steps={steps}
          styles={{
            buttonBack: {
              color: 'var(--color-primary-700)',
            },
            buttonPrimary: {
              borderRadius: '0.75rem',
              minHeight: 44,
            },
            buttonSkip: {
              minHeight: 44,
            },
            tooltip: {
              borderRadius: '1rem',
            },
          }}
        />
      ) : null}
    </GuidedTourContext.Provider>
  );
}
