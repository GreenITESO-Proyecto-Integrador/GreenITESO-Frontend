import { useEffect, useState } from 'react';
import { loadEvidencePreview } from '@/lib/api/evidence-preview';

interface AuditEvidencePreviewProps {
  evidenceUrl: string;
  evidenceObjectKey: string;
  actionName: string;
}

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Show the stored photograph, or the object key when this log has no file.
 * The evidence GET needs the bearer token, so the image is not loaded from
 * `evidence_url` directly. Object URLs are revoked when the card unmounts.
 */
export function AuditEvidencePreview({
  evidenceUrl,
  evidenceObjectKey,
  actionName,
}: AuditEvidencePreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<PreviewStatus>(evidenceUrl ? 'loading' : 'idle');

  useEffect(() => {
    if (!evidenceUrl) {
      setSrc(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setSrc(null);
    setStatus('loading');

    async function load() {
      try {
        const preview = await loadEvidencePreview(evidenceUrl);
        if (cancelled) return;
        if (!preview) {
          setStatus('error');
          return;
        }
        if (preview.kind === 'remote') {
          setSrc(preview.url);
          setStatus('ready');
          return;
        }
        const nextUrl = URL.createObjectURL(preview.blob);
        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        objectUrl = nextUrl;
        setSrc(nextUrl);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [evidenceUrl]);

  if (!evidenceUrl || status === 'error') {
    return (
      <div className="sm:col-span-2">
        <dt className="text-xs text-muted-foreground">Objeto de evidencia</dt>
        <dd className="font-medium break-all text-muted-foreground">
          {evidenceObjectKey || 'Sin clave de objeto'}
        </dd>
        {status === 'error' ? (
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">No se pudo mostrar la foto.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <dt className="text-xs text-muted-foreground">Evidencia fotográfica</dt>
      <dd>
        {status === 'loading' || !src ? (
          <p className="text-sm text-muted-foreground">Cargando foto…</p>
        ) : (
          <img
            src={src}
            alt={`Evidencia de ${actionName}`}
            className="mt-1 max-h-80 w-full rounded-xl bg-muted object-contain"
            onError={() => setStatus('error')}
          />
        )}
      </dd>
    </div>
  );
}
