import { Bell, Leaf, LogOut, Search, Settings, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBadge } from '@/components/shared/NotificationBadge';

interface NavbarProps {
  unreadNotifications?: number;
  userNickname?: string;
}

export function Navbar({ unreadNotifications = 0, userNickname = 'Usuario' }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-card">
      <div className="flex h-full items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-500 text-white">
            <Leaf className="size-5" />
          </span>
          <span className="hidden text-lg font-extrabold text-foreground sm:inline">
            GreenITESO
          </span>
        </Link>

        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar misiones, personas..." className="pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificaciones"
            render={<Link to="/notifications" />}
          >
            <span className="relative">
              <Bell />
              {unreadNotifications > 0 ? (
                <span className="absolute -top-1.5 -right-1.5">
                  <NotificationBadge count={unreadNotifications} />
                </span>
              ) : null}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Menú de usuario">
                  <Avatar size="sm">
                    <AvatarFallback>{userNickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserIcon />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <LogOut />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
