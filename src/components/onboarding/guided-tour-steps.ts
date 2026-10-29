import type { Step } from 'react-joyride';

export const TOUR_TARGETS = {
  appBrand: '[data-tour="app-brand"]',
  dashboardImpact: '[data-tour="dashboard-impact"]',
  shopOverview: '[data-tour="shop-overview"]',
  feedOverview: '[data-tour="feed-overview"]',
  leaderboardOverview: '[data-tour="leaderboard-overview"]',
  actionsOverview: '[data-tour="actions-overview"]',
  campaignsHeader: '[data-tour="campaigns-header"]',
  campaignsFilters: '[data-tour="campaigns-filters"]',
  campaignsList: '[data-tour="campaigns-list"]',
  campaignsProposals: '[data-tour="campaigns-proposals"]',
  campaignsCreate: '[data-tour="campaigns-create"]',
} as const;

export interface TourStep extends Step {
  route: string;
}

export const SIMPLE_STEPS: TourStep[] = [
  {
    route: '/',
    target: TOUR_TARGETS.appBrand,
    content: 'Desde aquí puedes volver a tu dashboard en cualquier momento.',
    placement: 'bottom-start',
  },
  {
    route: '/',
    target: TOUR_TARGETS.dashboardImpact,
    content: 'Consulta aquí tus métricas ambientales, puntos y racha actual.',
    placement: 'bottom',
  },
  {
    route: '/store',
    target: TOUR_TARGETS.shopOverview,
    content: 'En la tienda puedes canjear tus puntos por beneficios y artículos.',
    placement: 'top',
  },
  {
    route: '/feed',
    target: TOUR_TARGETS.feedOverview,
    content: 'Comparte tus logros y descubre el impacto que está creando la comunidad.',
    placement: 'top',
  },
  {
    route: '/leaderboard',
    target: TOUR_TARGETS.leaderboardOverview,
    content: 'Consulta tu posición y compárate con otras personas y clanes.',
    placement: 'top',
  },
  {
    route: '/actions',
    target: TOUR_TARGETS.actionsOverview,
    content: 'Explora el catálogo para conocer las acciones sustentables y sus puntos.',
    placement: 'top',
  },
];

export const CAMPAIGN_STEPS: TourStep[] = [
  {
    route: '/campaigns',
    target: TOUR_TARGETS.campaignsHeader,
    content: 'Las campañas reúnen retos ambientales en los que puedes participar.',
    placement: 'bottom',
  },
  {
    route: '/campaigns',
    target: TOUR_TARGETS.campaignsFilters,
    content: 'Usa estos filtros para encontrar campañas por estado y alcance.',
    placement: 'bottom',
  },
  {
    route: '/campaigns',
    target: TOUR_TARGETS.campaignsList,
    content: 'Abre una tarjeta para consultar los detalles de una campaña disponible.',
    placement: 'top',
  },
  {
    route: '/campaigns',
    target: TOUR_TARGETS.campaignsProposals,
    content: 'Aquí puedes revisar tus propuestas y proponer nuevas campañas.',
    placement: 'top',
  },
  {
    route: '/campaigns',
    target: TOUR_TARGETS.campaignsCreate,
    content: 'También puedes crear una campaña para tu clan desde este botón.',
    placement: 'bottom',
  },
];
