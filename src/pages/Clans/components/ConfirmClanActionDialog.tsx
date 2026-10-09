import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClanAction } from '@/hooks/use-clan-action';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';

interface ConfirmClanActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  /** The request to send when the user confirms. */
  action: () => Promise<unknown>;
  fallbackError: string;
  onDone: () => void;
}

function ConfirmBody({
  onCancel,
  confirmLabel,
  pendingLabel,
  destructive,
  action,
  fallbackError,
  onDone,
  onBusyChange,
}: Omit<ConfirmClanActionDialogProps, 'open' | 'onOpenChange' | 'title' | 'description'> & {
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { busy, error, run } = useClanAction(onBusyChange);

  async function handleConfirm() {
    if (await run(action, fallbackError)) onDone();
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant={destructive ? 'destructive' : 'default'}
          onClick={() => void handleConfirm()}
          disabled={busy}
          className={
            destructive
              ? 'min-h-11 cursor-pointer rounded-xl px-5 font-semibold'
              : 'min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600'
          }
        >
          {busy ? pendingLabel : confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Confirmation step for leaving or dissolving a clan.
 */
export function ConfirmClanActionDialog({
  open,
  onOpenChange,
  title,
  description,
  ...body
}: ConfirmClanActionDialogProps) {
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open ? (
          <ConfirmBody {...body} onCancel={() => onOpenChange(false)} onBusyChange={setBusy} />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
