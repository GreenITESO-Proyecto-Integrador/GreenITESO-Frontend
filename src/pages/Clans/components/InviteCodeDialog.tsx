import { useRef, useState } from 'react';
import { Copy, KeyRound, Trash2 } from 'lucide-react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClanAction } from '@/hooks/use-clan-action';
import { useClanInvitations } from '@/hooks/use-clan-invitations';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { createClanInvitation, revokeClanInvitation } from '@/lib/api/clans';
import { formatExpiry } from '@/lib/clan-meta';
import type { ClanInvitation, ClanInvitationCreated } from '@/types/clan';

interface InviteCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanId: string;
}

function ErrorText({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  );
}

/** The code the leader just generated. The backend never returns it again, so copy it now. */
function NewCode({ created }: { created: ClanInvitationCreated }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const expires = formatExpiry(created.expiresAt);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(created.code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/30">
      <p className="text-xs font-semibold tracking-wider text-primary-700 uppercase dark:text-primary-300">
        Código nuevo
      </p>
      <p
        data-testid="new-invite-code"
        className="font-mono text-3xl font-extrabold tracking-widest text-foreground"
      >
        {created.code}
      </p>
      <p className="text-xs text-muted-foreground">
        Funciona una sola vez{expires ? ` y vence el ${expires}` : ''}. Cópialo ahora: no lo
        volveremos a mostrar completo.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => void handleCopy()}
        className="min-h-11 cursor-pointer self-start rounded-xl px-5 font-semibold"
      >
        <Copy className="size-4" />
        Copiar código
      </Button>
      {copyState === 'copied' ? (
        <p role="status" className="text-sm text-primary-700 dark:text-primary-300">
          Código copiado.
        </p>
      ) : null}
      {copyState === 'failed' ? (
        <p role="alert" className="text-sm text-red-700">
          No se pudo copiar. Selecciónalo y cópialo manualmente.
        </p>
      ) : null}
    </div>
  );
}

function ActiveCodeRow({
  invitation,
  onRevoke,
  onBusyChange,
}: {
  invitation: ClanInvitation;
  onRevoke: (invitation: ClanInvitation) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const { busy, error, run } = useClanAction(onBusyChange);
  const expires = formatExpiry(invitation.expiresAt);

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold tracking-widest text-foreground">
            ••••-{invitation.codeHint}
          </p>
          {expires ? <p className="text-xs text-muted-foreground">Vence el {expires}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          aria-label={`Revocar código que termina en ${invitation.codeHint}`}
          onClick={() => void run(() => onRevoke(invitation), 'No se pudo revocar el código.')}
          disabled={busy}
          className="min-h-11 cursor-pointer rounded-xl px-4 font-semibold"
        >
          <Trash2 className="size-4" />
          {busy ? 'Revocando…' : 'Revocar'}
        </Button>
      </div>
      {error ? <ErrorText message={error} /> : null}
    </li>
  );
}

function InviteCodeBody({
  clanId,
  onBusyChange,
}: {
  clanId: string;
  onBusyChange: (busy: boolean) => void;
}) {
  const { invitations, status, errorMessage, reload, add, remove } = useClanInvitations(clanId);
  // Generating and revoking can overlap, so the dialog stays locked until all of them end.
  const running = useRef(0);
  const trackBusy = (isBusy: boolean) => {
    running.current += isBusy ? 1 : -1;
    onBusyChange(running.current > 0);
  };
  const { busy, error, run } = useClanAction(trackBusy);
  const [created, setCreated] = useState<ClanInvitationCreated | null>(null);

  async function handleGenerate() {
    await run(async () => {
      const invitation = await createClanInvitation(clanId);
      setCreated(invitation);
      add({
        id: invitation.id,
        codeHint: invitation.code.replace(/[\s-]/g, '').slice(-4),
        expiresAt: invitation.expiresAt,
        createdAt: new Date().toISOString(),
      });
      // The row above uses the browser's clock and the code's last digits: the list the
      // server sends back has the real values.
      void reload(true);
    }, 'No se pudo generar el código.');
  }

  async function handleRevoke(invitation: ClanInvitation) {
    await revokeClanInvitation(clanId, invitation.id);
    remove(invitation.id);
    // A code that was just shown and is now revoked is no use to copy.
    setCreated(current => (current?.id === invitation.id ? null : current));
  }

  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={busy || status === 'loading'}
        className="min-h-11 cursor-pointer self-start rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
      >
        <KeyRound className="size-4" />
        {busy ? 'Generando…' : 'Generar código'}
      </Button>

      {error ? <ErrorText message={error} /> : null}
      {created ? <NewCode created={created} /> : null}

      <section aria-label="Códigos activos" className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Códigos activos</h3>
        {status === 'loading' ? (
          <p role="status" className="text-sm text-muted-foreground">
            Cargando códigos…
          </p>
        ) : null}
        {status === 'error' ? (
          <div className="flex flex-col gap-2">
            <ErrorText message={errorMessage ?? 'No se pudieron cargar los códigos.'} />
            <Button
              type="button"
              variant="outline"
              onClick={() => void reload()}
              className="min-h-11 cursor-pointer self-start rounded-xl px-5 font-semibold"
            >
              Reintentar
            </Button>
          </div>
        ) : null}
        {status === 'success' && invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay códigos activos.</p>
        ) : null}
        {status === 'success' && invitations.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {invitations.map(invitation => (
              <ActiveCodeRow
                key={invitation.id}
                invitation={invitation}
                onRevoke={handleRevoke}
                onBusyChange={trackBusy}
              />
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

/**
 * Leader only: generate single-use invite codes for an invite-only clan, and revoke the ones
 * that have not been used. Whoever receives a code types it in "Tengo una invitación".
 */
export function InviteCodeDialog({ open, onOpenChange, clanId }: InviteCodeDialogProps) {
  // Closing while the code is being generated would lose it, since it is only returned once.
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Invitar con código</DialogTitle>
          <DialogDescription>
            Genera un código de un solo uso, válido por 48 horas, y compártelo con quien quieras
            invitar.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the list is fresh and a shown code is forgotten on close. */}
        {open ? <InviteCodeBody clanId={clanId} onBusyChange={setBusy} /> : null}
      </ModalContent>
    </Dialog>
  );
}
