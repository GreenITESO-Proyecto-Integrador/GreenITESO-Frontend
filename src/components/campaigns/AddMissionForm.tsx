import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionCatalog } from '@/hooks/use-action-catalog';
import { addMission } from '@/lib/api/campaigns';
import { toFriendlyMessage } from '@/lib/api/errors';
import { ActionPicker } from './ActionPicker';

interface AddMissionFormProps {
  campaignId: string;
  /** Codes of actions already used by the campaign (backend rejects repeats). */
  existingActionCodes: ReadonlySet<string>;
  onAdded: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Inline form to add one mission (catalog action + target) to a campaign in PROMOTION.
 */
export function AddMissionForm({
  campaignId,
  existingActionCodes,
  onAdded,
  onCancel,
}: AddMissionFormProps) {
  const { actions, status, reload } = useActionCatalog();
  const [actionId, setActionId] = useState('');
  const [targetCount, setTargetCount] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedCount = Number(targetCount);
    if (!actionId) {
      setError('Selecciona una acción.');
      return;
    }
    if (!Number.isInteger(parsedCount) || parsedCount < 1) {
      setError('La meta debe ser un entero de al menos 1.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addMission(campaignId, { actionId, targetCount: parsedCount });
      await onAdded();
    } catch (submitError) {
      setError(toFriendlyMessage(submitError, 'No se pudo agregar la misión.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Cargando catálogo de acciones…
      </p>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="text-sm font-semibold">No se pudo cargar el catálogo de acciones</p>
        <p className="mt-1 text-xs text-red-600">
          Inténtalo de nuevo; sin el catálogo no se pueden agregar misiones.
        </p>
        <Button
          type="button"
          onClick={() => void reload()}
          className="mt-3 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={event => void handleSubmit(event)}
      className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-4 ring-1 ring-border"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="add-mission-action">Acción</Label>
        <ActionPicker
          id="add-mission-action"
          actions={actions}
          value={actionId}
          onChange={setActionId}
          isDisabled={action => existingActionCodes.has(action.code)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="add-mission-target">Meta (veces)</Label>
        <Input
          id="add-mission-target"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={targetCount}
          onChange={event => setTargetCount(event.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
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
          {submitting ? 'Agregando…' : 'Agregar misión'}
        </Button>
      </div>
    </form>
  );
}
