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
      <label
        htmlFor="evidence-file"
        className="mb-2 block text-sm font-semibold text-secondary-500"
      >
        Evidencia fotográfica
        {requiredPhoto ? <span className="text-red-700"> *</span> : null}
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
          'h-11 min-h-11 rounded-xl border bg-white px-4 py-2 text-secondary-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-700',
          error ? 'border-red-200' : 'border-secondary-100',
        )}
      />
      <p id={helpId} className="mt-2 text-xs text-secondary-300">
        JPG, PNG o WEBP. Máximo {formatFileSize(MAX_EVIDENCE_FILE_BYTES)}.
        {requiredPhoto ? ' Esta acción exige foto.' : ' Opcional si la acción no pide evidencia.'}
      </p>
      {file ? (
        <p className="mt-1 text-xs font-semibold text-secondary-400">
          {file.name} · {formatFileSize(file.size)}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
