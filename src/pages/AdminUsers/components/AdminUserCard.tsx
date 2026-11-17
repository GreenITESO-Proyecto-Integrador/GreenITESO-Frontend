import { Ban, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/types/admin-user';
import { canBan, displayName, roleLabel, STATUS_LABEL } from './admin-user-meta';

interface AdminUserCardProps {
  user: AdminUser;
  currentUserId: string | undefined;
  onBan: (user: AdminUser) => void;
  onUnban: (user: AdminUser) => void;
}

const STATUS_CLASS = {
  ACTIVE: 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  BANNED: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  SELF_DEACTIVATED: 'bg-muted text-muted-foreground',
} as const;

/**
 * One account: who it is, whether it is banned, and the ban / unban action that applies.
 */
export function AdminUserCard({ user, currentUserId, onBan, onUnban }: AdminUserCardProps) {
  const name = displayName(user);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar src={user.avatarUrl} name={name} decorative className="size-11 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground" title={name}>
            {name}
          </p>
          <p className="truncate text-sm text-muted-foreground" title={user.email}>
            {user.email}
          </p>
          <p className="text-xs break-all text-muted-foreground">ID: {user.id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className={cn('h-6 px-2.5', STATUS_CLASS[user.status])}>
              {STATUS_LABEL[user.status]}
            </Badge>
            <Badge variant="outline" className="h-6 px-2.5">
              {roleLabel(user.role)}
            </Badge>
          </div>
        </div>
      </div>

      {user.status === 'BANNED' ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => onUnban(user)}
          aria-label={`Desbanear a ${name}`}
          className="min-h-11 cursor-pointer gap-2 rounded-xl px-4 font-semibold"
        >
          <ShieldCheck className="size-4" />
          Desbanear
        </Button>
      ) : canBan(user, currentUserId) ? (
        <Button
          type="button"
          variant="destructive"
          onClick={() => onBan(user)}
          aria-label={`Banear a ${name}`}
          className="min-h-11 cursor-pointer gap-2 rounded-xl px-4 font-semibold"
        >
          <Ban className="size-4" />
          Banear
        </Button>
      ) : null}
    </li>
  );
}
