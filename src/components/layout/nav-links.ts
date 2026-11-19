import {
  Bell,
  ClipboardCheck,
  Home,
  ListChecks,
  MessageSquarePlus,
  MessagesSquare,
  Rss,
  Store,
  Target,
  Trophy,
  User,
  UserCog,
  Users,
} from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
  icon: typeof Home;
  adminOnly?: boolean;
  /** Hidden for admins, who have their own entry for the same section. */
  hideForAdmin?: boolean;
}

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Campañas', href: '/campaigns', icon: Target },
  { label: 'Tienda', href: '/store', icon: Store },
  { label: 'Feed', href: '/feed', icon: Rss },
  { label: 'Notificaciones', href: '/notifications', icon: Bell },
];

export const SECONDARY_NAV_LINKS: NavLink[] = [
  { label: 'Mi perfil', href: '/profile', icon: User },
  { label: 'Catálogo de acciones', href: '/actions', icon: ListChecks },
  { label: 'Clanes', href: '/clans', icon: Users },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  {
    label: 'Buzón de feedback',
    href: '/feedback',
    icon: MessageSquarePlus,
    hideForAdmin: true,
  },
  { label: 'Auditoría', href: '/audit', icon: ClipboardCheck, adminOnly: true },
  { label: 'Buzón de feedback', href: '/admin/feedback', icon: MessagesSquare, adminOnly: true },
  { label: 'Usuarios', href: '/admin/users', icon: UserCog, adminOnly: true },
];

export const ALL_NAV_LINKS: NavLink[] = [...PRIMARY_NAV_LINKS, ...SECONDARY_NAV_LINKS];

export function filterNavLinks(links: NavLink[], isAdmin: boolean): NavLink[] {
  return links.filter(link => (!link.adminOnly || isAdmin) && !(link.hideForAdmin && isAdmin));
}
