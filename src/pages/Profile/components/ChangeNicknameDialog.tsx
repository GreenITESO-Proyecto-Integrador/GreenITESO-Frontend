import { useState } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { MAX_NICKNAME_LENGTH, changeNickname, type NicknameChangeResult } from '@/lib/api/account';

interface ChangeNicknameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNickname: string;
  /** Points this change costs: 0 the first time. */
  cost: number;
  availablePoints: number;
  onChanged: (result: NicknameChangeResult) => void;
}

export function ChangeNicknameDialog({
  open,
  onOpenChange,
  currentNickname,
  cost,
  availablePoints,
  onChanged,
}: ChangeNicknameDialogProps) {
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        {/* The form only exists while the dialog is open, so every opening starts from the
            current nickname with no stale error. */}
        <NicknameForm
          currentNickname={currentNickname}
          cost={cost}
          availablePoints={availablePoints}
          onChanged={onChanged}
          onClose={handleOpenChange}
          onClosed={() => onOpenChange(false)}
          setBusy={setBusy}
        />
      </ModalContent>
    </Dialog>
  );
}

interface NicknameFormProps extends Omit<ChangeNicknameDialogProps, 'open' | 'onOpenChange'> {
  onClose: (open: boolean) => void;
  /** Close after a successful change, even though the busy guard would still hold. */
  onClosed: () => void;
  setBusy: (busy: boolean) => void;
}

function NicknameForm({
  currentNickname,
  cost,
  availablePoints,
  onChanged,
  onClose,
  onClosed,
  setBusy,
}: NicknameFormProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = nickname.trim();
  const isUnchanged = trimmed === currentNickname;
  const cannotAfford = cost > availablePoints;
  const canSubmit = trimmed !== '' && !isUnchanged && !cannotAfford && !isSubmitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    setIsSubmitting(true);
    try {
      const result = await changeNickname(trimmed);
      onChanged(result);
      onClosed();
    } catch (err) {
      // The backend reports every rejection on the `nickname` field.
      const fieldError = err instanceof ApiError ? err.fieldErrors.nickname : undefined;
      setError(fieldError ?? toFriendlyMessage(err, 'No se pudo cambiar el nickname.'));
    } finally {
      setBusy(false);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader className="pr-10">
        <DialogTitle className="text-xl font-bold text-foreground">Cambiar nickname</DialogTitle>
        <DialogDescription>
          {cost === 0
            ? 'Tu primer cambio es gratis. Los siguientes cuestan puntos.'
            : `Cambiarlo cuesta ${cost} puntos. Tienes ${availablePoints}.`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="profile-nickname" className="text-sm font-semibold text-foreground">
            Nuevo nickname
          </Label>
          <Input
            id="profile-nickname"
            value={nickname}
            onChange={e => {
              setNickname(e.target.value);
              setError(null);
            }}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="off"
            aria-invalid={error !== null}
            aria-describedby={error ? 'profile-nickname-error' : undefined}
            className="h-11 rounded-xl"
          />
        </div>

        {cannotAfford ? (
          <p role="status" className="text-sm font-medium text-muted-foreground">
            No te alcanzan los puntos para cambiarlo todavía.
          </p>
        ) : null}

        {error ? (
          <p
            id="profile-nickname-error"
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            className="h-11 cursor-pointer rounded-xl"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit} className="h-11 cursor-pointer rounded-xl">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {cost === 0 ? 'Guardar' : `Pagar ${cost} puntos y guardar`}
          </Button>
        </div>
      </form>
    </>
  );
}
