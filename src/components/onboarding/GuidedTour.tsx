import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACTIONS, EVENTS, STATUS, type EventData, Joyride } from 'react-joyride';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GuidedTourContext } from '@/components/onboarding/guided-tour-context';
import { CAMPAIGN_STEPS, SIMPLE_STEPS, type TourStep } from './guided-tour-steps';

const TOUR_STORAGE_PREFIX = 'greeniteso.guided-tour.';

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

function removeStoredTourStatus(userId: string, phase: TourPhase): void {
  try {
    localStorage.removeItem(getTourStorageKey(userId, phase));
  } catch {
    // Keep replay usable when browser storage is blocked.
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
  const navigatingToRouteRef = useRef<string | null>(null);
  const currentPathnameRef = useRef(location.pathname);

  const userId = user?.id ?? '';
  const simpleStatus = userId ? getStoredTourStatus(userId, 'simple') : null;
  const campaignsStatus = userId ? getStoredTourStatus(userId, 'campaigns') : null;
  const steps = phase === 'campaigns' ? CAMPAIGN_STEPS : SIMPLE_STEPS;
  const activeStep: TourStep | null = phase ? (steps[stepIndex] ?? null) : null;

  useEffect(() => {
    currentPathnameRef.current = location.pathname;
  }, [location.pathname]);

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
        setPhase('campaigns');
        setStepIndex(0);
        return;
      }

      setPhase(null);
    },
    [campaignsStatus, phase, userId],
  );

  useEffect(() => {
    if (!enabled || isAdmin || !userId || simpleStatus) {
      return;
    }

    setPhase('simple');
    setStepIndex(0);
  }, [enabled, isAdmin, simpleStatus, userId]);

  useEffect(() => {
    if (!phase || !activeStep || !enabled || isAdmin) {
      setRun(false);
      return;
    }

    if (currentPathnameRef.current === activeStep.route) {
      const timer = window.setTimeout(() => setRun(true), 0);
      return () => window.clearTimeout(timer);
    }

    navigatingToRouteRef.current = activeStep.route;
    setRun(false);
    navigate(activeStep.route);
  }, [activeStep, enabled, isAdmin, navigate, phase]);

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
      finishTour('skipped');
    }
  }, [activeStep, enabled, finishTour, isAdmin, location.pathname, phase, run]);

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
      finishTour('skipped');
      return;
    }

    if (type !== EVENTS.STEP_AFTER) {
      return;
    }

    if (action === ACTIONS.PREV) {
      setStepIndex(Math.max(0, index - 1));
      return;
    }

    if (action === ACTIONS.NEXT) {
      if (index + 1 >= steps.length) {
        finishTour('completed');
      } else {
        setStepIndex(index + 1);
      }
    }
  }

  const startTour = useCallback(
    (nextPhase: TourPhase) => {
      if (!enabled || isAdmin || !userId) {
        return;
      }

      removeStoredTourStatus(userId, nextPhase);
      navigatingToRouteRef.current = null;
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
