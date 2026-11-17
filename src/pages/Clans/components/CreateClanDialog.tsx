import { useRef, useState, type FormEvent } from 'react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { createClan } from '@/lib/api/clans';
import type { ClanListItem } from '@/types/clan';
import { readClanFormError, type ClanFormValues } from './clan-form';
import { ClanFormFields } from './ClanFormFields';

interface CreateClanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (clan: ClanListItem) => void;
}

function CreateClanForm({
  onCreated,
  onCancel,
  onBusyChange,
}: {
  onCreated: (clan: ClanListItem) => void;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [values, setValues] = useState<ClanFormValues>({
    name: '',
    description: '',
    privacy: 'PUBLIC',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Blocks a second submit fired before React disables the button.
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!values.name.trim()) found.name = 'Escribe un nombre para el clan.';
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0 || inFlight.current) return;

    inFlight.current = true;
    onBusyChange(true);
    setSubmitting(true);
    try {
      const clan = await createClan({
        name: values.name.trim(),
        description: values.description.trim(),
        privacy: values.privacy,
      });
      onCreated(clan);
    } catch (error) {
      const failure = readClanFormError(error, 'No se pudo crear el clan.');
      setErrors(failure.errors);
      setSubmitError(failure.submitError);
    } finally {
      inFlight.current = false;
      onBusyChange(false);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      <ClanFormFields values={values} errors={errors} onChange={setValues} />

      {submitError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

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
          {submitting ? 'Creando…' : 'Crear clan'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Create a private clan. The creator becomes its leader (one leadership per user).
 */
export function CreateClanDialog({ open, onOpenChange, onCreated }: CreateClanDialogProps) {
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Crear clan</DialogTitle>
          <DialogDescription>
            Reúne a tu equipo para sumar puntos juntos. Serás el líder del clan.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets every time. */}
        {open ? (
          <CreateClanForm
            onCreated={onCreated}
            onCancel={() => onOpenChange(false)}
            onBusyChange={setBusy}
          />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
