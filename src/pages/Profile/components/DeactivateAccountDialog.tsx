import { useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { deactivateAccount } from '@/lib/api/account';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { clearSession } from '@/lib/auth/session';

const DEACTIVATE_FALLBACK = 'No se pudo desactivar la cuenta.';

interface DeactivateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateAccountDialog({ open, onOpenChange }: DeactivateAccountDialogProps) {
  const navigate = useNavigate();
  const { handleOpenChange, setBusy, isBusy } = useDialogBusyGuard(onOpenChange);
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUnderstood(false);
    setError(null);
  }, [open]);

  async function handleConfirm() {
    // The ref is already set on a second click in the same tick; `isSubmitting` is not.
    if (!open || !understood || isBusy()) return;
    setError(null);
    setBusy(true);
    setIsSubmitting(true);
    try {
      await deactivateAccount();
      // The backend already revoked the refresh tokens; drop the local session too.
      clearSession();
      navigate('/login', { replace: true });
    } catch (err) {
      // A leader of a clan or the last admin is refused on the `account` field. Any other API
      // error would show the first field it carries, which may have nothing to do with this.
      if (err instanceof ApiError) {
        setError(err.fieldErrors.account ?? DEACTIVATE_FALLBACK);
      } else {
        setError(toFriendlyMessage(err, DEACTIVATE_FALLBACK));
      }
      setBusy(false);
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-foreground">Desactivar cuenta</DialogTitle>
          <DialogDescription>
            Tu cuenta dejará de estar activa y se cerrará tu sesión en todos tus dispositivos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Se borra tu progreso: puntos, racha, insignias, clanes, campañas, notificaciones y
            publicaciones. Si vuelves a iniciar sesión, tu cuenta se reactiva y empiezas desde cero.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={understood}
            onChange={e => setUnderstood(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-destructive"
          />
          <span>Entiendo que perderé mi progreso y quiero desactivar mi cuenta.</span>
        </label>

        {error ? (
          <p
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
            onClick={() => handleOpenChange(false)}
            className="h-11 cursor-pointer rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!understood || isSubmitting}
            onClick={() => void handleConfirm()}
            className="h-11 cursor-pointer rounded-xl font-semibold"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Desactivar mi cuenta
          </Button>
        </div>
      </ModalContent>
    </Dialog>
  );
}
