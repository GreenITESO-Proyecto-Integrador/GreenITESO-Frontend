import { useRef, useState, type FormEvent } from 'react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { updateClan } from '@/lib/api/clans';
import type { ClanListItem, UpdateClanPayload } from '@/types/clan';
import { readClanFormError, type ClanFormValues } from './clan-form';
import { ClanFormFields } from './ClanFormFields';

interface EditClanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clan: Pick<ClanListItem, 'id' | 'name' | 'description' | 'privacy'>;
  onSaved: () => void;
}

/** Only what the leader actually changed, so an untouched field is never overwritten. */
function changedFields(
  clan: EditClanDialogProps['clan'],
  values: ClanFormValues,
): UpdateClanPayload {
  const payload: UpdateClanPayload = {};
  if (values.name.trim() !== clan.name) payload.name = values.name.trim();
  if (values.description.trim() !== clan.description) {
    payload.description = values.description.trim();
  }
  if (values.privacy !== clan.privacy) payload.privacy = values.privacy;
  return payload;
}

function privacyNote(
  from: ClanListItem['privacy'],
  to: ClanListItem['privacy'],
): string | undefined {
  if (from === 'PRIVATE_INVITE' && to === 'PUBLIC') {
    return 'Las solicitudes pendientes no se aceptan solas: las seguirás aprobando tú.';
  }
  if (from === 'PUBLIC' && to === 'PRIVATE_INVITE') {
    return 'Los miembros actuales se quedan. El clan dejará de verse para quien no sea miembro.';
  }
  return undefined;
}

function EditClanForm({
  clan,
  onSaved,
  onCancel,
  onBusyChange,
}: {
  clan: EditClanDialogProps['clan'];
  onSaved: () => void;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [values, setValues] = useState<ClanFormValues>({
    name: clan.name,
    description: clan.description,
    privacy: clan.privacy,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Blocks a second submit fired before React disables the button.
  const inFlight = useRef(false);
  const payload = changedFields(clan, values);
  const unchanged = Object.keys(payload).length === 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!values.name.trim()) found.name = 'Escribe un nombre para el clan.';
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0 || unchanged || inFlight.current) return;

    inFlight.current = true;
    onBusyChange(true);
    setSubmitting(true);
    try {
      await updateClan(clan.id, payload);
      onSaved();
    } catch (error) {
      const failure = readClanFormError(error, 'No se pudo guardar el clan.');
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
      <ClanFormFields
        values={values}
        errors={errors}
        onChange={setValues}
        privacyNote={privacyNote(clan.privacy, values.privacy)}
      />

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
          disabled={submitting || unchanged}
          className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Leader only: edit the clan's name, description and privacy. The avatar is not part of this form.
 */
export function EditClanDialog({ open, onOpenChange, clan, onSaved }: EditClanDialogProps) {
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Editar clan</DialogTitle>
          <DialogDescription>
            Cambia el nombre, la descripción o la privacidad de {clan.name}.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts from the clan's current values. */}
        {open ? (
          <EditClanForm
            clan={clan}
            onSaved={onSaved}
            onCancel={() => onOpenChange(false)}
            onBusyChange={setBusy}
          />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
