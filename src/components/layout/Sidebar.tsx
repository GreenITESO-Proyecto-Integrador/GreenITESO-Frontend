import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ALL_NAV_LINKS } from '@/components/layout/nav-links';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 top-16 hidden w-64 shrink-0 border-r border-border bg-card md:block">
      <nav className="flex flex-col gap-1 p-3">
        {ALL_NAV_LINKS.map(link => (
          <NavLink
            key={link.href}
            to={link.href}
            end={link.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive &&
                  'bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/40 dark:hover:text-primary-300',
              )
            }
          >
            <link.icon className="size-5 shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
