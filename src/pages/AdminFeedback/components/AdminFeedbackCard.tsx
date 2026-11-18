import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import { FilterChips } from '@/components/shared/FilterChips';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchFeedbackScreenshotPreview, updateFeedback } from '@/lib/api/feedback';
import type { FeedbackStatus, FeedbackSubmission } from '@/types/feedback';
import { CATEGORY_NAMES } from '../../Feedback/components/feedback-categories';
import { StatusBadge } from '../../Feedback/components/FeedbackStatusBadge';

const MAX_NOTES_LENGTH = 500;

const STATUS_OPTIONS: readonly { value: FeedbackStatus; label: string }[] = [
  { value: 'OPEN', label: 'Recibido' },
  { value: 'IN_REVIEW', label: 'En revisión' },
  { value: 'RESOLVED', label: 'Resuelto' },
];

interface AdminFeedbackCardProps {
  item: FeedbackSubmission;
  onUpdated: (updated: FeedbackSubmission) => void;
}

/**
 * One submission for the admin window: full message, screenshot, and status / notes editing.
 */
export function AdminFeedbackCard({ item, onUpdated }: AdminFeedbackCardProps) {
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [notes, setNotes] = useState(item.adminNotes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [isLoadingShot, setIsLoadingShot] = useState(false);
  const [shotError, setShotError] = useState(false);
  const [shot, setShot] = useState<{ url: string; revoke: boolean } | null>(null);

  useEffect(() => {
    return () => {
      if (shot?.revoke) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  const notesTrimmed = notes.trim();
  const isDirty = status !== item.status || notesTrimmed !== (item.adminNotes ?? '');
  const canSave = isDirty && !isSaving && notes.length <= MAX_NOTES_LENGTH;

  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateFeedback(item.id, { status, adminNotes: notesTrimmed });
      setNotes(updated.adminNotes ?? '');
      setStatus(updated.status);
      setSaved(true);
      onUpdated(updated);
    } catch (err) {
      setSaveError(toFriendlyMessage(err, 'No se pudo guardar los cambios.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenScreenshot() {
    setIsLoadingShot(true);
    setShotError(false);
    try {
      setShot(await fetchFeedbackScreenshotPreview(item.id));
    } catch {
      setShotError(true);
    } finally {
      setIsLoadingShot(false);
    }
  }

  return (
    <li className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {CATEGORY_NAMES[item.category] || item.category}
          </span>
          {item.rating ? (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ★ {item.rating}/5
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{date}</span>
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-foreground">{item.subject}</h3>
        {item.userEmail ? (
          <p className="text-xs text-muted-foreground">Enviado por {item.userEmail}</p>
        ) : null}
        <p className="mt-2 text-sm whitespace-pre-line text-foreground">{item.message}</p>
      </div>

      {item.hasScreenshot && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => void handleOpenScreenshot()}
            disabled={isLoadingShot}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline disabled:opacity-50 dark:text-primary-300"
          >
            {isLoadingShot ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Cargando captura...</span>
              </>
            ) : (
              <>
                <Eye className="size-3.5" />
                <span>Ver captura adjunta</span>
              </>
            )}
          </button>
          {shotError && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3" />
              No se pudo cargar la imagen adjunta.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-border pt-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Estado</Label>
          <FilterChips
            label="Estado del comentario"
            options={STATUS_OPTIONS}
            value={status}
            onChange={next => {
              setStatus(next);
              setSaved(false);
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`notes-${item.id}`} className="text-sm font-semibold text-foreground">
              Respuesta al usuario
            </Label>
            <span
              className={`text-xs ${
                notes.length > MAX_NOTES_LENGTH
                  ? 'font-bold text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {notes.length} / {MAX_NOTES_LENGTH}
            </span>
          </div>
          <Textarea
            id={`notes-${item.id}`}
            rows={3}
            value={notes}
            disabled={isSaving}
            onChange={e => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="Esta nota la verá el usuario en «Mis comentarios enviados»."
            className="resize-none rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {saveError && (
            <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {saveError}
            </p>
          )}
          {saved && !isDirty && (
            <p
              role="status"
              className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              Cambios guardados
            </p>
          )}
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => void handleSave()}
            className="min-h-11 cursor-pointer rounded-xl bg-primary-600 font-semibold text-white hover:bg-primary-700"
          >
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(shot)} onOpenChange={open => !open && setShot(null)}>
        <ModalContent className="p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Captura adjunta</DialogTitle>
            <DialogDescription className="truncate text-xs text-muted-foreground">
              {item.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="relative mt-2 flex items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5 p-2 dark:bg-black/40">
            {shot?.url && (
              <img
                src={shot.url}
                alt={`Captura adjunta de ${item.subject}`}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            )}
          </div>
        </ModalContent>
      </Dialog>
    </li>
  );
}
