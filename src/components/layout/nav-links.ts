import {
  Bell,
  ClipboardCheck,
  Home,
  ListChecks,
  Rss,
  Store,
  Target,
  Trophy,
  User,
  Users,
} from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
  icon: typeof Home;
}

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Misiones', href: '/missions', icon: Target },
  { label: 'Tienda', href: '/store', icon: Store },
  { label: 'Feed', href: '/feed', icon: Rss },
  { label: 'Notificaciones', href: '/notifications', icon: Bell },
];

export const SECONDARY_NAV_LINKS: NavLink[] = [
  { label: 'Mi perfil', href: '/profile', icon: User },
  { label: 'Catálogo de acciones', href: '/actions', icon: ListChecks },
  { label: 'Clanes', href: '/clans', icon: Users },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Auditoría', href: '/audit', icon: ClipboardCheck },
];

export const ALL_NAV_LINKS: NavLink[] = [...PRIMARY_NAV_LINKS, ...SECONDARY_NAV_LINKS];
