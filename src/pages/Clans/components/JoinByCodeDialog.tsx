import { useRef, useState, type FormEvent } from 'react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/campaigns/FieldError';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { redeemClanInvitation } from '@/lib/api/clans';
import { toFriendlyMessage } from '@/lib/api/errors';
import { isInviteCodeShape } from '@/lib/clan-meta';
import type { ClanMembership } from '@/types/clan';

interface JoinByCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: (membership: ClanMembership) => void;
}

function JoinByCodeForm({
  onJoined,
  onCancel,
  onBusyChange,
}: {
  onJoined: (membership: ClanMembership) => void;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  // Blocks a second submit fired before React disables the button.
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!isInviteCodeShape(value)) {
      setError('El código tiene 8 caracteres, por ejemplo ABCD-1234.');
      return;
    }

    inFlight.current = true;
    onBusyChange(true);
    setSubmitting(true);
    setError(undefined);
    try {
      onJoined(await redeemClanInvitation(value.trim()));
    } catch (caught) {
      setError(toFriendlyMessage(caught, 'No se pudo canjear el código.'));
    } finally {
      inFlight.current = false;
      onBusyChange(false);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="clan-invite-code">Código de invitación</Label>
        <Input
          id="clan-invite-code"
          value={value}
          onChange={event => {
            setValue(event.target.value.toUpperCase());
            setError(undefined);
          }}
          aria-invalid={error ? true : undefined}
          placeholder="ABCD-1234"
          maxLength={20}
          className="h-11 rounded-xl px-3 font-mono tracking-widest"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <FieldError message={error} />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          {submitting ? 'Canjeando…' : 'Unirme al clan'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Entry point for invite-only clans: they are not listed, so the user types the single-use code
 * the leader generated and joins that clan right away.
 */
export function JoinByCodeDialog({ open, onOpenChange, onJoined }: JoinByCodeDialogProps) {
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Tengo una invitación</DialogTitle>
          <DialogDescription>
            Escribe el código que te dio el líder del clan. Funciona una sola vez y vence a las 48
            horas.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <JoinByCodeForm
            onJoined={onJoined}
            onCancel={() => onOpenChange(false)}
            onBusyChange={setBusy}
          />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
