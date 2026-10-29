import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACTIONS, EVENTS, STATUS, type EventData, Joyride, type Step } from 'react-joyride';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GuidedTourContext } from '@/components/onboarding/guided-tour-context';

const TOUR_STORAGE_PREFIX = 'greeniteso.guided-tour.';

type TourPhase = 'simple' | 'campaigns';
type TourStatus = 'completed' | 'skipped';

interface TourStep extends Step {
  route: string;
}

const SIMPLE_STEPS: TourStep[] = [
  {
    route: '/',
    target: '[data-tour="app-brand"]',
    content: 'Desde aquí puedes volver a tu dashboard en cualquier momento.',
    placement: 'bottom-start',
  },
  {
    route: '/',
    target: '[data-tour="dashboard-impact"]',
    content: 'Consulta aquí tus métricas ambientales, puntos y racha actual.',
    placement: 'bottom',
  },
  {
    route: '/shop',
    target: '[data-tour="shop-overview"]',
    content: 'En la tienda puedes canjear tus puntos por beneficios y artículos.',
    placement: 'top',
  },
  {
    route: '/feed',
    target: '[data-tour="feed-overview"]',
    content: 'Comparte tus logros y descubre el impacto que está creando la comunidad.',
    placement: 'top',
  },
  {
    route: '/leaderboard',
    target: '[data-tour="leaderboard-overview"]',
    content: 'Consulta tu posición y compárate con otras personas y clanes.',
    placement: 'top',
  },
  {
    route: '/actions',
    target: '[data-tour="actions-overview"]',
    content: 'Explora el catálogo para conocer las acciones sustentables y sus puntos.',
    placement: 'top',
  },
];

const CAMPAIGN_STEPS: TourStep[] = [
  {
    route: '/campaigns',
    target: '[data-tour="campaigns-header"]',
    content: 'Las campañas reúnen retos ambientales en los que puedes participar.',
    placement: 'bottom',
  },
  {
    route: '/campaigns',
    target: '[data-tour="campaigns-filters"]',
    content: 'Usa estos filtros para encontrar campañas por estado y alcance.',
    placement: 'bottom',
  },
  {
    route: '/campaigns',
    target: '[data-tour="campaigns-list"]',
    content: 'Abre una tarjeta para consultar los detalles de una campaña disponible.',
    placement: 'top',
  },
  {
    route: '/campaigns',
    target: '[data-tour="campaigns-proposals"]',
    content: 'Aquí puedes revisar tus propuestas y proponer nuevas campañas.',
    placement: 'top',
  },
  {
    route: '/campaigns',
    target: '[data-tour="campaigns-create"]',
    content: 'También puedes crear una campaña para tu clan desde este botón.',
    placement: 'bottom',
  },
];

function getTourStorageKey(userId: string, phase: TourPhase): string {
  return `${TOUR_STORAGE_PREFIX}${userId}.${phase}`;
}

function getStoredTourStatus(userId: string, phase: TourPhase): TourStatus | null {
  if (!userId) return null;
  const value = sessionStorage.getItem(getTourStorageKey(userId, phase));
  return value === 'completed' || value === 'skipped' ? value : null;
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
  const navigatingRef = useRef(false);

  const userId = user?.id ?? '';
  const simpleStatus = userId ? getStoredTourStatus(userId, 'simple') : null;
  const steps = phase === 'campaigns' ? CAMPAIGN_STEPS : SIMPLE_STEPS;
  const activeStep = phase ? steps[stepIndex] : null;

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

    if (location.pathname !== activeStep.route) {
      navigatingRef.current = true;
      setRun(false);
      navigate(activeStep.route);
      return;
    }

    const timer = window.setTimeout(() => {
      navigatingRef.current = false;
      setRun(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeStep, enabled, isAdmin, location.pathname, navigate, phase]);

  function finishTour(status: TourStatus) {
    if (!userId || !phase) {
      setRun(false);
      return;
    }

    sessionStorage.setItem(getTourStorageKey(userId, phase), status);
    setRun(false);

    if (phase === 'simple' && status === 'completed') {
      setPhase('campaigns');
      setStepIndex(0);
      return;
    }

    setPhase(null);
  }

  function handleEvent(data: EventData) {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(Math.max(0, index + (action === ACTIONS.PREV ? -1 : 1)));
    }

    if (navigatingRef.current) {
      return;
    }

    if (status === STATUS.FINISHED) {
      finishTour('completed');
    } else if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      finishTour('skipped');
    }
  }

  function startTour(nextPhase: TourPhase) {
    if (!enabled || isAdmin || !userId) {
      return;
    }

    sessionStorage.removeItem(getTourStorageKey(userId, nextPhase));
    setPhase(nextPhase);
    setStepIndex(0);
    setRun(false);
  }

  const contextValue = {
    canReplaySimple: enabled && !isAdmin && Boolean(userId),
    canReplayCampaigns: enabled && !isAdmin && Boolean(userId),
    startSimple: () => startTour('simple'),
    startCampaigns: () => startTour('campaigns'),
  };

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
