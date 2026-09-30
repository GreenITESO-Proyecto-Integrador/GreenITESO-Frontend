import { useRef, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActionCatalog } from '@/hooks/use-action-catalog';
import { useClans } from '@/hooks/use-clans';
import { createCampaign, proposeCampaign } from '@/lib/api/campaigns';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { ActionPicker } from './ActionPicker';

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CampaignFormMode;
  onSubmitted: () => void;
}

/**
 * - `create-admin`: ADMIN creates directly. No clan = GLOBAL; a clan = PRIVATE (the backend
 *   only accepts INSTITUTIONAL clans for admins).
 * - `create-clan`: any user picks a clan; the backend checks they lead it.
 * - `propose`: non-admin proposes a GLOBAL campaign for review.
 */
export type CampaignFormMode = 'create-admin' | 'create-clan' | 'propose';

/** Select value meaning "no clan" (GLOBAL campaign). */
const NO_CLAN = '__none__';

const MODE_COPY: Record<CampaignFormMode, { title: string; description: string }> = {
  'create-admin': {
    title: 'Crear campaña',
    description:
      'Sin clan, la campaña es global y se publica de inmediato. También puedes elegir un clan institucional.',
  },
  'create-clan': {
    title: 'Crear campaña de clan',
    description: 'Elige el clan. Solo el líder de ese clan puede crear su campaña.',
  },
  propose: {
    title: 'Proponer campaña',
    description: 'Un administrador revisará tu propuesta antes de publicarla.',
  },
};

interface MissionRow {
  key: number;
  actionId: string;
  targetCount: string;
}

type FieldErrors = Record<string, string>;

/** Backend keys shown under a specific field; anything else goes in the general error. */
const FIELD_KEYS = ['title', 'description', 'start_date', 'end_date', 'missions', 'target_clan'];

/**
 * Local start of day for a `YYYY-MM-DD` value.
 */
function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/**
 * Local end of day for a `YYYY-MM-DD` value, so a same-day campaign is valid.
 */
function endOfDay(value: string): Date {
  return new Date(`${value}T23:59:59`);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-700" role="alert">
      {message}
    </p>
  );
}

function CampaignForm({
  mode,
  onSubmitted,
  onCancel,
}: {
  mode: CampaignFormMode;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const { actions, status, reload } = useActionCatalog();
  const hasClanPicker = mode !== 'propose';
  const clansData = useClans(hasClanPicker);
  const [clanId, setClanId] = useState(mode === 'create-admin' ? NO_CLAN : '');
  const nextRowKey = useRef(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // TODO: cuando exista el endpoint "mis clanes" del Equipo 2, listar solo los clanes PRIVATE que
  // lidera el usuario. Por ahora se listan todos los PRIVATE y el backend valida el liderazgo.
  const [rows, setRows] = useState<MissionRow[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedActionIds = new Set(rows.map(row => row.actionId).filter(Boolean));

  function addRow() {
    setRows(current => [...current, { key: nextRowKey.current++, actionId: '', targetCount: '1' }]);
  }

  function updateRow(key: number, change: Partial<MissionRow>) {
    setRows(current => current.map(row => (row.key === key ? { ...row, ...change } : row)));
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    if (mode === 'create-clan' && !clanId) found.target_clan = 'Elige un clan.';
    if (!title.trim()) found.title = 'Escribe un título.';
    if (!description.trim()) found.description = 'Escribe una descripción.';
    if (!startDate) found.start_date = 'Elige la fecha de inicio.';
    if (!endDate) found.end_date = 'Elige la fecha de fin.';

    if (startDate && endDate) {
      if (endOfDay(endDate) <= startOfDay(startDate)) {
        found.end_date = 'La fecha de fin debe ser posterior al inicio.';
      } else if (endOfDay(endDate) <= new Date()) {
        found.end_date = 'La fecha de fin debe estar en el futuro.';
      }
    }

    if (rows.some(row => !row.actionId)) {
      found.missions = 'Selecciona una acción en cada misión.';
    } else if (
      rows.some(row => !Number.isInteger(Number(row.targetCount)) || Number(row.targetCount) < 1)
    ) {
      found.missions = 'La meta de cada misión debe ser un entero de al menos 1.';
    } else if (selectedActionIds.size !== rows.length) {
      found.missions = 'No repitas acciones en la misma campaña.';
    }
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        startDate: startOfDay(startDate).toISOString(),
        endDate: endOfDay(endDate).toISOString(),
        missions: rows.map(row => ({
          actionId: row.actionId,
          targetCount: Number(row.targetCount),
        })),
      };
      await (mode === 'propose'
        ? proposeCampaign(payload)
        : createCampaign({
            ...payload,
            targetClanId: hasClanPicker && clanId && clanId !== NO_CLAN ? clanId : undefined,
          }));
      onSubmitted();
    } catch (error) {
      if (error instanceof ApiError) {
        const entries = Object.entries(error.fieldErrors);
        setErrors(Object.fromEntries(entries.filter(([key]) => FIELD_KEYS.includes(key))));
        // Errors outside the form fields (e.g. 403 "not the clan leader") show in general.
        const general = entries.find(([key]) => !FIELD_KEYS.includes(key));
        setSubmitError(general ? general[1] : entries.length === 0 ? error.message : null);
      } else {
        setSubmitError(toFriendlyMessage(error, 'No se pudo enviar la campaña.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Backend: ADMIN only for INSTITUTIONAL clans, LEADER only for PRIVATE clans.
  const allowedClanType = mode === 'create-admin' ? 'INSTITUTIONAL' : 'PRIVATE';
  const availableClans = clansData.clans.filter(clan => clan.type === allowedClanType);
  const clanItems = [
    ...(mode === 'create-admin' ? [{ value: NO_CLAN, label: 'Global (sin clan)' }] : []),
    ...availableClans.map(clan => ({ value: clan.id, label: clan.name })),
  ];

  return (
    <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      {hasClanPicker ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="campaign-clan">
            {mode === 'create-admin' ? 'Clan (opcional)' : 'Clan'}
          </Label>
          {clansData.status === 'error' && mode === 'create-admin' ? (
            // Admin is not blocked: without the clan list, only a GLOBAL campaign can be created.
            <p className="text-sm text-muted-foreground" role="status">
              No se pudo cargar la lista de clanes; solo podrás crear una campaña global.{' '}
              <button
                type="button"
                className="min-h-11 cursor-pointer font-semibold underline"
                onClick={() => void clansData.reload()}
              >
                Reintentar
              </button>
            </p>
          ) : clansData.status === 'error' ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="text-sm font-semibold">No se pudo cargar la lista de clanes</p>
              {clansData.errorMessage ? (
                <p className="mt-1 text-xs text-red-600">{clansData.errorMessage}</p>
              ) : null}
              <Button
                type="button"
                onClick={() => void clansData.reload()}
                className="mt-3 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <Select
              value={clanId || null}
              onValueChange={next => setClanId(next ?? '')}
              items={clanItems}
            >
              <SelectTrigger
                id="campaign-clan"
                aria-invalid={errors.target_clan ? true : undefined}
                className="h-11 w-full min-w-0 rounded-xl px-3"
              >
                <SelectValue
                  placeholder={
                    clansData.status === 'loading' ? 'Cargando clanes…' : 'Selecciona un clan'
                  }
                />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="min-w-64">
                {mode === 'create-admin' ? (
                  <SelectItem value={NO_CLAN} className="min-h-11">
                    Global (sin clan)
                  </SelectItem>
                ) : null}
                {availableClans.map(clan => (
                  <SelectItem key={clan.id} value={clan.id} className="min-h-11">
                    {clan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FieldError message={errors.target_clan} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="campaign-title">Título</Label>
        <Input
          id="campaign-title"
          value={title}
          maxLength={200}
          aria-invalid={errors.title ? true : undefined}
          onChange={event => setTitle(event.target.value)}
          className="h-11 rounded-xl"
        />
        <FieldError message={errors.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="campaign-description">Descripción</Label>
        <Textarea
          id="campaign-description"
          value={description}
          aria-invalid={errors.description ? true : undefined}
          onChange={event => setDescription(event.target.value)}
          className="min-h-24 rounded-xl"
        />
        <FieldError message={errors.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="campaign-start">Fecha de inicio</Label>
          <Input
            id="campaign-start"
            type="date"
            value={startDate}
            aria-invalid={errors.start_date ? true : undefined}
            onChange={event => setStartDate(event.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError message={errors.start_date} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="campaign-end">Fecha de fin</Label>
          <Input
            id="campaign-end"
            type="date"
            value={endDate}
            aria-invalid={errors.end_date ? true : undefined}
            onChange={event => setEndDate(event.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError message={errors.end_date} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-foreground">Misiones</legend>

        {status === 'loading' ? (
          <p className="text-sm text-muted-foreground" role="status">
            Cargando catálogo de acciones…
          </p>
        ) : null}

        {status === 'error' ? (
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
        ) : null}

        {status === 'success' ? (
          <>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún sin misiones. Puedes agregarlas ahora o después.
              </p>
            ) : null}

            {rows.map((row, index) => (
              <div
                key={row.key}
                className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-3 ring-1 ring-border sm:flex-row sm:items-end"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Label htmlFor={`mission-action-${row.key}`}>Acción {index + 1}</Label>
                  <ActionPicker
                    id={`mission-action-${row.key}`}
                    actions={actions}
                    value={row.actionId}
                    onChange={actionId => updateRow(row.key, { actionId })}
                    isDisabled={action =>
                      action.id !== row.actionId && selectedActionIds.has(action.id)
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 sm:w-28">
                  <Label htmlFor={`mission-target-${row.key}`}>Meta</Label>
                  <Input
                    id={`mission-target-${row.key}`}
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={row.targetCount}
                    onChange={event => updateRow(row.key, { targetCount: event.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Quitar misión ${index + 1}`}
                  onClick={() => setRows(current => current.filter(item => item.key !== row.key))}
                  className="size-11 shrink-0 cursor-pointer rounded-xl border-red-200 bg-red-50 p-0 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>
            ))}

            <FieldError message={errors.missions} />

            <Button
              type="button"
              variant="outline"
              disabled={rows.length >= actions.length}
              onClick={addRow}
              className="min-h-11 cursor-pointer self-start rounded-xl px-5 font-semibold"
            >
              <Plus className="size-4" />
              Agregar misión
            </Button>
          </>
        ) : null}
      </fieldset>

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
          {submitting ? 'Enviando…' : mode === 'propose' ? 'Proponer campaña' : 'Crear campaña'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Modal to create (ADMIN) or propose (everyone else) a GLOBAL campaign.
 */
export function CampaignFormDialog({
  open,
  onOpenChange,
  mode,
  onSubmitted,
}: CampaignFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-foreground">
            {MODE_COPY[mode].title}
          </DialogTitle>
          <DialogDescription>{MODE_COPY[mode].description}</DialogDescription>
        </DialogHeader>
        <CampaignForm
          mode={mode}
          onCancel={() => onOpenChange(false)}
          onSubmitted={() => {
            onOpenChange(false);
            onSubmitted();
          }}
        />
      </ModalContent>
    </Dialog>
  );
}
