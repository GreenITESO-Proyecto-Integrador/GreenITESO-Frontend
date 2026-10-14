import type { CatalogAction } from '@/types/action-catalog';

export const MAX_EVIDENCE_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_EVIDENCE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ActionLogFormErrors = {
  actionId?: string;
  evidence?: string;
};

export interface ActionLogFormValues {
  actionId: string;
  evidence: File | null;
}

/**
 * Object key stored with the action log for the photo the user picked.
 * Object storage is not provisioned yet, so this names the file; it does not upload the bytes.
 */
export function buildEvidenceObjectKey(file: File): string {
  const sanitized = file.name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  const name = sanitized || 'evidencia';
  return `evidence/${crypto.randomUUID()}/${name}`.slice(0, 500);
}

/**
 * Format a byte size for helper text next to the evidence input.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate the selected catalog action and photographic evidence (5 MB, image types).
 */
export function validateActionLogForm(
  values: ActionLogFormValues,
  selectedAction: CatalogAction | undefined,
): ActionLogFormErrors {
  const errors: ActionLogFormErrors = {};

  if (!values.actionId) {
    errors.actionId = 'Selecciona una acción del catálogo.';
  }

  const evidence = values.evidence;
  const requiresPhoto = selectedAction?.validationType === 'PHOTO';

  if (requiresPhoto && !evidence) {
    errors.evidence = 'Esta acción requiere evidencia fotográfica.';
  }

  if (evidence) {
    if (evidence.size > MAX_EVIDENCE_FILE_BYTES) {
      errors.evidence = 'La evidencia no puede superar 5 MB.';
    } else if (!ACCEPTED_EVIDENCE_MIME_TYPES.some(type => type === evidence.type)) {
      errors.evidence = 'Usa una imagen JPG, PNG o WEBP.';
    }
  }

  return errors;
}
