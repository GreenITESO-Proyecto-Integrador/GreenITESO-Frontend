import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PRIMARY_NAV_LINKS, SECONDARY_NAV_LINKS } from '@/components/layout/nav-links';
import { NotificationBadge } from '@/components/shared/NotificationBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface BottomNavProps {
  unreadNotifications?: number;
}

const tabClassName = (isActive: boolean) =>
  cn(
    'relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-secondary-300 dark:text-secondary-300',
    isActive && 'text-primary-500',
  );

export function BottomNav({ unreadNotifications = 0 }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const isSecondaryActive = SECONDARY_NAV_LINKS.some(link => link.href === location.pathname);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-secondary-100 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-lg md:hidden dark:border-secondary-700 dark:bg-secondary-800"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-2">
          {PRIMARY_NAV_LINKS.map(link => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === '/'}
              className={({ isActive }) => tabClassName(isActive)}
            >
              <span className="relative">
                <link.icon className="size-6" />
                {link.href === '/notifications' && unreadNotifications > 0 ? (
                  <span className="absolute -top-1 -right-1.5">
                    <NotificationBadge count={unreadNotifications} />
                  </span>
                ) : null}
              </span>
              <span className="text-xs font-semibold">{link.label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={tabClassName(isSecondaryActive)}
          >
            <MoreHorizontal className="size-6" />
            <span className="text-xs font-semibold">Más</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
          <SheetHeader>
            <SheetTitle>Más opciones</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4">
            {SECONDARY_NAV_LINKS.map(link => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted',
                    isActive &&
                      'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
                  )
                }
              >
                <link.icon className="size-5" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
