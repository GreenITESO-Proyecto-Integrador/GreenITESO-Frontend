import { Input } from '@/components/ui/input';
import {
  ACCEPTED_EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_FILE_BYTES,
  formatFileSize,
} from '@/lib/action-log-form';
import { cn } from '@/lib/utils';

interface EvidenceFileInputProps {
  file: File | null;
  error?: string;
  requiredPhoto: boolean;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

/**
 * File input for photographic evidence, limited to 5 MB image types.
 * Labels, helper copy, and file name follow semantic theme tokens (light/dark).
 */
export function EvidenceFileInput({
  file,
  error,
  requiredPhoto,
  disabled,
  onChange,
}: EvidenceFileInputProps) {
  const errorId = 'evidence-file-error';
  const helpId = 'evidence-file-help';

  return (
    <div>
      <label htmlFor="evidence-file" className="mb-2 block text-sm font-semibold text-foreground">
        Evidencia fotográfica
        {requiredPhoto ? <span className="text-destructive"> *</span> : null}
      </label>
      <Input
        id="evidence-file"
        name="evidence"
        type="file"
        accept={ACCEPTED_EVIDENCE_MIME_TYPES.join(',')}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helpId}
        onChange={event => {
          onChange(event.target.files?.[0] ?? null);
        }}
        className={cn(
          'h-11 min-h-11 rounded-xl border bg-background px-4 py-2 text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-accent-foreground',
          error ? 'border-destructive' : 'border-input',
        )}
      />
      <p id={helpId} className="mt-2 text-xs text-muted-foreground">
        JPG, PNG o WEBP. Máximo {formatFileSize(MAX_EVIDENCE_FILE_BYTES)}.
        {requiredPhoto ? ' Esta acción exige foto.' : ' Opcional si la acción no pide evidencia.'}
      </p>
      {file ? (
        <p className="mt-1 text-xs font-semibold text-foreground">
          {file.name} · {formatFileSize(file.size)}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
