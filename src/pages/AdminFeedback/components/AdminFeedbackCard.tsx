import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchFeedbackScreenshotPreview, updateFeedback } from '@/lib/api/feedback';
import type { FeedbackStatus, FeedbackSubmission } from '@/types/feedback';
import { FeedbackCategoryBadge } from '../../Feedback/components/FeedbackCategoryBadge';
import { FeedbackStatusPicker } from './FeedbackStatusPicker';

const MAX_NOTES_LENGTH = 500;

interface AdminFeedbackCardProps {
  item: FeedbackSubmission;
  onUpdated: (updated: FeedbackSubmission) => void;
  /** Reports whether this card holds unsaved edits, so the page can guard navigation. */
  onDirtyChange: (id: string, dirty: boolean) => void;
}

/**
 * One submission with everything in view: message on the left, status badges and reply on the
 * right (stacked on mobile).
 */
export function AdminFeedbackCard({ item, onUpdated, onDirtyChange }: AdminFeedbackCardProps) {
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

  useEffect(() => {
    onDirtyChange(item.id, isDirty);
  }, [item.id, isDirty, onDirtyChange]);

  // A card that leaves the list no longer holds edits.
  useEffect(() => {
    return () => onDirtyChange(item.id, false);
  }, [item.id, onDirtyChange]);

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
    <li className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <FeedbackCategoryBadge category={item.category} />
            {item.rating ? (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ★ {item.rating}/5
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <h3 className="text-base font-bold text-foreground">{item.subject}</h3>
          {item.userEmail ? (
            <p className="truncate text-xs text-muted-foreground">{item.userEmail}</p>
          ) : null}
          <p className="text-sm whitespace-pre-line text-foreground">{item.message}</p>

          {item.hasScreenshot && (
            <div>
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
        </div>

        <div className="min-w-0 space-y-3 md:border-l md:border-border md:pl-6">
          <FeedbackStatusPicker
            label="Estado del comentario"
            value={status}
            disabled={isSaving}
            onChange={next => {
              setStatus(next);
              setSaved(false);
            }}
          />

          <div className="space-y-1">
            <Textarea
              aria-label="Respuesta al usuario"
              rows={3}
              value={notes}
              disabled={isSaving}
              onChange={e => {
                setNotes(e.target.value);
                setSaved(false);
              }}
              placeholder="Respuesta para el usuario (la verá en «Mis comentarios enviados»)"
              className="resize-none rounded-xl"
            />
            <p
              className={`text-right text-xs ${
                notes.length > MAX_NOTES_LENGTH
                  ? 'font-bold text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {notes.length} / {MAX_NOTES_LENGTH}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {saveError && (
              <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {saveError}
              </p>
            )}
            {isDirty ? (
              <p
                role="status"
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
              >
                <span aria-hidden="true" className="size-2 rounded-full bg-amber-500" />
                Sin guardar
              </p>
            ) : saved ? (
              <p
                role="status"
                className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2 className="size-3.5 shrink-0" />
                Cambios guardados
              </p>
            ) : null}
            <Button
              type="button"
              disabled={!canSave}
              onClick={() => void handleSave()}
              className="min-h-11 cursor-pointer rounded-xl bg-primary-600 font-semibold text-white hover:bg-primary-700"
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
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
