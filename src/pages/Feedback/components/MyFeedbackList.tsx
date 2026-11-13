import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle2, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ModalContent } from '@/components/custom/ModalContent';
import type { FeedbackSubmission } from '@/types/feedback';
import { fetchFeedbackScreenshotBlobUrl } from '@/lib/api/feedback';
import { cn } from '@/lib/utils';

interface MyFeedbackListProps {
  items: FeedbackSubmission[];
  isLoading: boolean;
}

const CATEGORY_NAMES: Record<string, string> = {
  BUG: 'Error técnico',
  IDEA: 'Idea o mejora',
  ECO_ACTION: 'Acción eco',
  ACCESSIBILITY: 'Accesibilidad',
  OTHER: 'Comentario',
};

function StatusBadge({ status }: { status: FeedbackSubmission['status'] }) {
  if (status === 'RESOLVED') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-3" />
        Resuelto
      </Badge>
    );
  }

  if (status === 'IN_REVIEW') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
      >
        <Clock className="size-3" />
        En revisión
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <Clock className="size-3" />
      Recibido
    </Badge>
  );
}

export function MyFeedbackList({ items, isLoading }: MyFeedbackListProps) {
  const [loadingScreenshotId, setLoadingScreenshotId] = useState<string | null>(null);
  const [screenshotErrorId, setScreenshotErrorId] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<{
    url: string;
    subject: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (activeScreenshot?.url) {
        URL.revokeObjectURL(activeScreenshot.url);
      }
    };
  }, [activeScreenshot]);

  const handleOpenScreenshot = async (item: FeedbackSubmission) => {
    try {
      setLoadingScreenshotId(item.id);
      setScreenshotErrorId(null);
      const blobUrl = await fetchFeedbackScreenshotBlobUrl(item.id);
      setActiveScreenshot({ url: blobUrl, subject: item.subject });
    } catch {
      setScreenshotErrorId(item.id);
    } finally {
      setLoadingScreenshotId(null);
    }
  };

  const handleCloseModal = () => {
    if (activeScreenshot?.url) {
      URL.revokeObjectURL(activeScreenshot.url);
    }
    setActiveScreenshot(null);
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border bg-card animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center space-y-2">
        <MessageSquare className="size-10 text-muted-foreground mx-auto stroke-[1.5]" />
        <p className="text-sm font-semibold text-foreground">Aún no has enviado comentarios</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Tus sugerencias y reportes aparecerán aquí junto con las respuestas del equipo
          administrador.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map(item => {
          const date = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '';

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
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
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {item.message}
                </p>
              </div>

              {item.hasScreenshot && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => void handleOpenScreenshot(item)}
                    disabled={loadingScreenshotId === item.id}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline min-h-11 min-w-11 cursor-pointer disabled:opacity-50"
                  >
                    {loadingScreenshotId === item.id ? (
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
                  {screenshotErrorId === item.id && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      No se pudo cargar la imagen adjunta.
                    </p>
                  )}
                </div>
              )}

              {item.adminNotes && (
                <div
                  className={cn(
                    'rounded-xl p-3 border text-xs space-y-1',
                    'border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
                  )}
                >
                  <p className="font-bold">Respuesta del equipo GreenITESO:</p>
                  <p className="whitespace-pre-line">{item.adminNotes}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(activeScreenshot)} onOpenChange={open => !open && handleCloseModal()}>
        <ModalContent className="sm:max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Captura adjunta</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              {activeScreenshot?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="relative mt-2 flex items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/40 p-2">
            {activeScreenshot?.url && (
              <img
                src={activeScreenshot.url}
                alt={`Captura adjunta de ${activeScreenshot.subject}`}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            )}
          </div>
        </ModalContent>
      </Dialog>
    </>
  );
}
