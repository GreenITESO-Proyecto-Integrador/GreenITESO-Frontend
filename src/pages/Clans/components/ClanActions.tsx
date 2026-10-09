import { useState } from 'react';
import { Copy, Crown, DoorOpen, Star, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClanAction } from '@/hooks/use-clan-action';
import { dissolveClan, joinClan, leaveClan, selectActiveClan } from '@/lib/api/clans';
import { buildInviteLink } from '@/lib/clan-meta';
import type { ClanDetail } from '@/types/clan';
import { ConfirmClanActionDialog } from './ConfirmClanActionDialog';
import { TransferLeadershipDialog } from './TransferLeadershipDialog';

interface ClanActionsProps {
  clan: ClanDetail;
  viewerId: string | null;
  /** The user's current active private clan is this one. */
  isActiveClan: boolean;
  /** The clan changed and the page should refresh; `notice` is the success message. */
  onChanged: (notice: string) => void;
  /** Show a message without refreshing anything (a purely local action, like copying the link). */
  onNotice: (notice: string) => void;
  /** The user left or dissolved the clan, so its page no longer applies. */
  onLeft: (notice: string) => void;
}

const PRIMARY_BUTTON =
  'min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600';
const SECONDARY_BUTTON = 'min-h-11 cursor-pointer rounded-xl px-5 font-semibold';

/**
 * What the current user can do on a clan page: join, set it as the active clan, share the link,
 * leave, and (leader only) transfer leadership or dissolve.
 */
export function ClanActions({
  clan,
  viewerId,
  isActiveClan,
  onChanged,
  onNotice,
  onLeft,
}: ClanActionsProps) {
  const { busy, error, run } = useClanAction();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [dissolveOpen, setDissolveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  if (clan.type !== 'PRIVATE') {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Los clanes institucionales se asignan automáticamente según tu carrera o departamento.
      </p>
    );
  }

  const me = clan.members.find(member => member.userId === viewerId);
  const isMember = me !== undefined;
  const isLeader = me?.role === 'LEADER';
  const candidates = clan.members.filter(member => member.userId !== viewerId);

  async function handleJoin() {
    const ok = await run(async () => {
      const membership = await joinClan(clan.id);
      onChanged(
        membership.status === 'PENDING'
          ? 'Solicitud enviada. El líder la revisará.'
          : `Te uniste a ${clan.name}.`,
      );
    }, 'No se pudo completar la solicitud.');
    return ok;
  }

  async function handleSelectActive() {
    await run(async () => {
      await selectActiveClan(clan.id);
      onChanged(`${clan.name} es ahora tu clan activo.`);
    }, 'No se pudo establecer el clan activo.');
  }

  async function handleCopyLink() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(buildInviteLink(clan.id));
      onNotice('Enlace copiado. Compártelo con quien quieras invitar.');
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <section aria-label="Acciones del clan" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {!isMember ? (
          <Button
            type="button"
            onClick={() => void handleJoin()}
            disabled={busy}
            className={PRIMARY_BUTTON}
          >
            <UserPlus className="size-4" />
            {busy
              ? 'Uniéndote…'
              : clan.privacy === 'PUBLIC'
                ? 'Unirme al clan'
                : 'Solicitar unirme'}
          </Button>
        ) : null}

        {isMember ? (
          isActiveClan ? (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-5 text-sm font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
              <Star className="size-4" />
              Es tu clan activo
            </span>
          ) : (
            <Button
              type="button"
              onClick={() => void handleSelectActive()}
              disabled={busy}
              className={PRIMARY_BUTTON}
            >
              <Star className="size-4" />
              {busy ? 'Guardando…' : 'Establecer como clan activo'}
            </Button>
          )
        ) : null}

        {isMember ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCopyLink()}
            className={SECONDARY_BUTTON}
          >
            <Copy className="size-4" />
            Copiar enlace de invitación
          </Button>
        ) : null}

        {isMember && !isLeader ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setLeaveOpen(true)}
            className={SECONDARY_BUTTON}
          >
            <DoorOpen className="size-4" />
            Salir del clan
          </Button>
        ) : null}

        {isLeader ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferOpen(true)}
              disabled={candidates.length === 0}
              className={SECONDARY_BUTTON}
            >
              <Crown className="size-4" />
              Transferir liderazgo
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDissolveOpen(true)}
              className={SECONDARY_BUTTON}
            >
              <Trash2 className="size-4" />
              Disolver clan
            </Button>
          </>
        ) : null}
      </div>

      {isLeader && candidates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Para transferir el liderazgo, el clan necesita al menos otro miembro.
        </p>
      ) : null}

      {copyFailed ? (
        <p role="alert" className="text-sm text-red-700">
          No se pudo copiar el enlace. Cópialo manualmente: {buildInviteLink(clan.id)}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <ConfirmClanActionDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="¿Salir del clan?"
        description={`Dejarás de formar parte de ${clan.name} y de sus campañas. Podrás volver a unirte si el clan lo permite.`}
        confirmLabel="Salir del clan"
        pendingLabel="Saliendo…"
        action={() => leaveClan(clan.id)}
        fallbackError="No se pudo salir del clan."
        onDone={() => onLeft(`Saliste de ${clan.name}.`)}
      />

      <ConfirmClanActionDialog
        open={dissolveOpen}
        onOpenChange={setDissolveOpen}
        title="¿Disolver el clan?"
        description={`${clan.name} dejará de existir para todos sus miembros. Esta acción no se puede deshacer.`}
        confirmLabel="Disolver clan"
        pendingLabel="Disolviendo…"
        destructive
        action={() => dissolveClan(clan.id)}
        fallbackError="No se pudo disolver el clan."
        onDone={() => onLeft(`${clan.name} se disolvió.`)}
      />

      <TransferLeadershipDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        clanId={clan.id}
        candidates={candidates}
        onTransferred={name => {
          setTransferOpen(false);
          onChanged(`${name} es ahora la persona líder de ${clan.name}.`);
        }}
      />
    </section>
  );
}
