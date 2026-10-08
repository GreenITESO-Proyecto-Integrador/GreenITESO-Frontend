import { useState, type FormEvent } from 'react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/campaigns/FieldError';
import { extractClanId } from '@/lib/clan-meta';

interface JoinByLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (clanId: string) => void;
}

function JoinByLinkForm({
  onResolved,
  onCancel,
}: {
  onResolved: (clanId: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clanId = extractClanId(value);
    if (!clanId) {
      setError(
        'No encontramos un clan en ese enlace. Pega el enlace completo que te compartieron.',
      );
      return;
    }
    onResolved(clanId);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="clan-invite-link">Enlace de invitación</Label>
        <Input
          id="clan-invite-link"
          value={value}
          onChange={event => {
            setValue(event.target.value);
            setError(undefined);
          }}
          aria-invalid={error ? true : undefined}
          placeholder="https://…/clans/…"
          className="h-11 rounded-xl px-3"
          autoComplete="off"
        />
        <FieldError message={error} />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}

/**
 * Entry point for invite-only clans: they are not listed, so the user pastes the link the
 * leader shared and lands on that clan's page.
 */
export function JoinByLinkDialog({ open, onOpenChange, onResolved }: JoinByLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Tengo una invitación</DialogTitle>
          <DialogDescription>
            Pega el enlace que te compartió el líder del clan para ver el clan y solicitar unirte.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <JoinByLinkForm onResolved={onResolved} onCancel={() => onOpenChange(false)} />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
