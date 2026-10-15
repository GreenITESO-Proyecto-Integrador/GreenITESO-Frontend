import { apiFetch, getApiBaseUrl } from './client';

const EVIDENCE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type EvidencePreview = { kind: 'blob'; blob: Blob } | { kind: 'remote'; url: string };

/**
 * Turn the queue's evidence URL into the path `apiFetch` expects.
 * The list returns an absolute URL; this client always calls the configured API.
 */
export function evidenceRequestPath(evidenceUrl: string): string {
  const trimmed = evidenceUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return '';
  }
}

/**
 * True when the media type is a JPG, PNG, or WEBP photograph.
 */
export function isEvidenceImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return EVIDENCE_IMAGE_TYPES.has(mediaType);
}

/**
 * True when a response URL still belongs to the configured API origin.
 */
export function isOurApiUrl(url: string, apiBaseUrl = getApiBaseUrl()): boolean {
  if (!url) return false;
  try {
    return new URL(url).origin === new URL(apiBaseUrl).origin;
  } catch {
    return false;
  }
}

/**
 * Choose how to show one evidence response.
 * Disk storage returns the image bytes. A private bucket redirects to a signed
 * URL: keep the blob when that body is an image, and otherwise use the final
 * URL as the image source so the token stays on our API.
 */
export async function readEvidencePreview(response: Response): Promise<EvidencePreview | null> {
  const contentType = response.headers.get('content-type');
  if (response.ok && isEvidenceImageContentType(contentType)) {
    return { kind: 'blob', blob: await response.blob() };
  }
  if (response.url && !isOurApiUrl(response.url)) {
    return { kind: 'remote', url: response.url };
  }
  return null;
}

/**
 * Load the photograph for one audit card. An empty URL means the log has no file.
 */
export async function loadEvidencePreview(evidenceUrl: string): Promise<EvidencePreview | null> {
  const path = evidenceRequestPath(evidenceUrl);
  if (!path) return null;
  const response = await apiFetch(path);
  return readEvidencePreview(response);
}
