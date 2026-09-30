import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateCampaign } from '@/lib/api/campaigns';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import type { CampaignDetail } from '@/types/campaign';
import { endOfDay, startOfDay, toDateInputValue, validateDates } from '../campaign-dates';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, WRAP_TEXT } from '../field-limits';
import { CharCounter } from './CharCounter';
import { FieldError } from './FieldError';

interface EditCampaignFormProps {
  campaign: CampaignDetail;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}

/** Backend keys shown under a specific field; anything else goes in the general error. */
const FIELD_KEYS = ['title', 'description', 'start_date', 'end_date'];

/**
 * Inline form to edit title, description and dates of a campaign in PROMOTION.
 * Missions are managed separately ("Agregar misión").
 */
export function EditCampaignForm({ campaign, onSaved, onCancel }: EditCampaignFormProps) {
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description);
  const [startDate, setStartDate] = useState(toDateInputValue(campaign.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(campaign.endDate));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = validateDates(startDate, endDate);
    if (!title.trim()) found.title = 'Escribe un título.';
    if (!description.trim()) found.description = 'Escribe una descripción.';
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await updateCampaign(campaign.id, {
        title: title.trim(),
        description: description.trim(),
        startDate: startOfDay(startDate).toISOString(),
        endDate: endOfDay(endDate).toISOString(),
      });
      await onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        const entries = Object.entries(error.fieldErrors);
        setErrors(Object.fromEntries(entries.filter(([key]) => FIELD_KEYS.includes(key))));
        const general = entries.find(([key]) => !FIELD_KEYS.includes(key));
        setSubmitError(general ? general[1] : entries.length === 0 ? error.message : null);
      } else {
        setSubmitError(toFriendlyMessage(error, 'No se pudo guardar la campaña.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-campaign-title">Título</Label>
        <Input
          id="edit-campaign-title"
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          aria-invalid={errors.title ? true : undefined}
          onChange={event => setTitle(event.target.value)}
          className="h-11 rounded-xl"
        />
        <div className="flex items-start justify-between gap-3">
          <FieldError message={errors.title} />
          <div className="ml-auto">
            <CharCounter value={title} max={TITLE_MAX_LENGTH} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-campaign-description">Descripción</Label>
        <Textarea
          id="edit-campaign-description"
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          aria-invalid={errors.description ? true : undefined}
          onChange={event => setDescription(event.target.value)}
          className={`max-h-48 min-h-24 resize-none overflow-y-auto rounded-xl ${WRAP_TEXT}`}
        />
        <div className="flex items-start justify-between gap-3">
          <FieldError message={errors.description} />
          <div className="ml-auto">
            <CharCounter value={description} max={DESCRIPTION_MAX_LENGTH} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-campaign-start">Fecha de inicio</Label>
          <Input
            id="edit-campaign-start"
            type="date"
            value={startDate}
            aria-invalid={errors.start_date ? true : undefined}
            onChange={event => setStartDate(event.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError message={errors.start_date} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-campaign-end">Fecha de fin</Label>
          <Input
            id="edit-campaign-end"
            type="date"
            value={endDate}
            aria-invalid={errors.end_date ? true : undefined}
            onChange={event => setEndDate(event.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError message={errors.end_date} />
        </div>
      </div>

      {submitError ? (
        <p className="text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
          className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600 disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
