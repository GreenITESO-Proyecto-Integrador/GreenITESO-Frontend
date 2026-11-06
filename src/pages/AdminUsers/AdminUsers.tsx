import { useCallback, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';
import { FilterChips } from '@/components/shared/FilterChips';
import { Pagination } from '@/components/shared/Pagination';
import { SectionState } from '@/components/shared/SectionState';
import { Input } from '@/components/ui/input';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useCurrentUser } from '@/hooks/use-current-user';
import { banUser, unbanUser } from '@/lib/api/admin-users';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/types/admin-user';
import { ConfirmClanActionDialog } from '@/pages/Clans/components/ConfirmClanActionDialog';
import { AdminUserCard } from './components/AdminUserCard';
import { displayName, FILTER_OPTIONS } from './components/admin-user-meta';

interface PendingAction {
  kind: 'ban' | 'unban';
  user: AdminUser;
}

/**
 * Admin window to find accounts by id (or email / name) and ban or unban them.
 */
export function AdminUsersPage() {
  const { user: currentUser } = useCurrentUser();
  const data = useAdminUsers();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const target = pending?.user;
  const name = target ? displayName(target) : '';
  const isBan = pending?.kind === 'ban';

  function handleDone() {
    if (!pending) return;
    setNotice(
      pending.kind === 'ban'
        ? `${displayName(pending.user)} fue baneado y su sesión se cerró.`
        : `${displayName(pending.user)} fue desbaneado y ya puede iniciar sesión.`,
    );
    setPending(null);
    void data.reload();
  }

  return (
    <>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-8 pb-24">
        <header>
          <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase dark:text-primary-400">
            Administración
          </p>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Banea o desbanea cuentas. Una cuenta baneada pierde su sesión y no puede volver a entrar
            hasta que la desbanees.
          </p>
        </header>

        {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

        <div className="flex flex-col gap-4">
          <FilterChips
            label="Filtrar usuarios"
            options={FILTER_OPTIONS}
            value={data.filter}
            onChange={data.setFilter}
          />
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={data.searchInput}
              onChange={event => data.setSearch(event.target.value)}
              aria-label="Buscar por ID, correo o nombre"
              placeholder="Buscar por ID, correo o nombre"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </div>

        <SectionState
          status={data.status}
          errorMessage={data.errorMessage}
          onRetry={() => void data.reload()}
          isEmpty={data.users.length === 0}
          loadingText="Cargando usuarios…"
          errorTitle="No se pudieron cargar los usuarios"
          emptyIcon={Users}
          emptyTitle="Sin resultados"
          emptyText="No hay usuarios con ese filtro o búsqueda. Prueba con otro."
        >
          <ul
            aria-label="Usuarios"
            aria-busy={data.refreshing}
            className={cn(
              'flex flex-col gap-3 transition-opacity',
              data.refreshing && 'opacity-60',
            )}
          >
            {data.users.map(user => (
              <AdminUserCard
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                onBan={account => setPending({ kind: 'ban', user: account })}
                onUnban={account => setPending({ kind: 'unban', user: account })}
              />
            ))}
          </ul>
        </SectionState>

        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={data.setPage}
          label="usuarios"
        />
      </div>

      <ConfirmClanActionDialog
        open={pending !== null}
        onOpenChange={open => {
          if (!open) setPending(null);
        }}
        title={isBan ? `¿Banear a ${name}?` : `¿Desbanear a ${name}?`}
        description={
          isBan
            ? 'Se cerrará su sesión en todos sus dispositivos y no podrá iniciar sesión. Sus datos se conservan y puedes desbanearla cuando quieras.'
            : 'Podrá iniciar sesión de nuevo con su cuenta tal como la dejó.'
        }
        confirmLabel={isBan ? 'Banear' : 'Desbanear'}
        pendingLabel={isBan ? 'Baneando…' : 'Desbaneando…'}
        destructive={isBan}
        action={() =>
          target ? (isBan ? banUser(target.id) : unbanUser(target.id)) : Promise.resolve()
        }
        fallbackError={isBan ? 'No se pudo banear la cuenta.' : 'No se pudo desbanear la cuenta.'}
        onDone={handleDone}
      />
    </>
  );
}
