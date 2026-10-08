import { useRef, useState, type FormEvent } from 'react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CharCounter } from '@/components/campaigns/CharCounter';
import { FieldError } from '@/components/campaigns/FieldError';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/campaigns/field-limits';
import { FilterChips } from '@/components/shared/FilterChips';
import { createClan } from '@/lib/api/clans';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { PRIVACY_META, PRIVACY_OPTIONS } from '@/lib/clan-meta';
import type { ClanListItem, ClanPrivacy } from '@/types/clan';

interface CreateClanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (clan: ClanListItem) => void;
}

/** Backend keys shown under a specific field; anything else goes in the general error. */
const FIELD_KEYS = ['name', 'description', 'privacy'];

function CreateClanForm({
  onCreated,
  onCancel,
}: {
  onCreated: (clan: ClanListItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<ClanPrivacy>('PUBLIC');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Blocks a second submit fired before React disables the button.
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Escribe un nombre para el clan.';
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0 || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      const clan = await createClan({
        name: name.trim(),
        description: description.trim(),
        privacy,
      });
      onCreated(clan);
    } catch (error) {
      if (error instanceof ApiError) {
        const entries = Object.entries(error.fieldErrors);
        setErrors(Object.fromEntries(entries.filter(([key]) => FIELD_KEYS.includes(key))));
        const general = entries.find(([key]) => !FIELD_KEYS.includes(key));
        setSubmitError(general ? general[1] : entries.length === 0 ? error.message : null);
      } else {
        setSubmitError(toFriendlyMessage(error, 'No se pudo crear el clan.'));
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="clan-name">Nombre</Label>
        <Input
          id="clan-name"
          value={name}
          maxLength={TITLE_MAX_LENGTH}
          onChange={event => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          className="h-11 rounded-xl px-3"
          autoComplete="off"
        />
        <CharCounter value={name} max={TITLE_MAX_LENGTH} />
        <FieldError message={errors.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="clan-description">Descripción (opcional)</Label>
        <Textarea
          id="clan-description"
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          onChange={event => setDescription(event.target.value)}
          aria-invalid={errors.description ? true : undefined}
          className="min-h-24 rounded-xl px-3 py-2"
        />
        <CharCounter value={description} max={DESCRIPTION_MAX_LENGTH} />
        <FieldError message={errors.description} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Privacidad</Label>
        <FilterChips
          label="Privacidad del clan"
          options={PRIVACY_OPTIONS}
          value={privacy}
          onChange={setPrivacy}
        />
        <p className="text-xs text-muted-foreground">{PRIVACY_META[privacy].description}</p>
        <FieldError message={errors.privacy} />
      </div>

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Crear clan</DialogTitle>
          <DialogDescription>
            Reúne a tu equipo para sumar puntos juntos. Serás el líder del clan.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets every time. */}
        {open ? (
          <CreateClanForm onCreated={onCreated} onCancel={() => onOpenChange(false)} />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
