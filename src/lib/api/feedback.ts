import { apiFetch, getApiBaseUrl } from './client';
import { readError } from './errors';
import { evidenceRequestPath, readEvidencePreview } from './evidence-preview';
import type {
  AdminFeedbackFilters,
  AdminFeedbackPage,
  FeedbackAdminUpdatePayload,
  FeedbackCreatePayload,
  FeedbackSubmission,
  PaginatedFeedback,
} from '@/types/feedback';

export const FEEDBACK_PATH = '/api/v1/feedback/';
export const MY_FEEDBACK_PATH = '/api/v1/feedback/mine/';

export interface ScreenshotPreviewSource {
  url: string;
  revoke: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function mapFeedbackSubmission(raw: unknown): FeedbackSubmission {
  if (!isRecord(raw)) {
    throw new Error('Respuesta de feedback inválida');
  }

  return {
    id: readString(raw.id),
    userEmail: readString(raw.user_email),
    category: readString(raw.category, 'OTHER') as FeedbackSubmission['category'],
    rating: readNumber(raw.rating),
    subject: readString(raw.subject),
    message: readString(raw.message),
    hasScreenshot: Boolean(raw.has_screenshot),
    status: readString(raw.status, 'OPEN') as FeedbackSubmission['status'],
    adminNotes: readString(raw.admin_notes),
    createdAt: readString(raw.created_at),
    updatedAt: readString(raw.updated_at),
  };
}

export async function submitFeedback(payload: FeedbackCreatePayload): Promise<FeedbackSubmission> {
  let body: BodyInit;
  const headers: HeadersInit = {};

  if (payload.screenshot) {
    const formData = new FormData();
    formData.append('category', payload.category);
    formData.append('subject', payload.subject);
    formData.append('message', payload.message);
    if (payload.rating !== null && payload.rating !== undefined) {
      formData.append('rating', String(payload.rating));
    }
    formData.append('screenshot', payload.screenshot);
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      category: payload.category,
      subject: payload.subject,
      message: payload.message,
      rating: payload.rating ?? null,
    });
  }

  const response = await apiFetch(FEEDBACK_PATH, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw await readError(response, 'No se pudo enviar el comentario.');
  }

  const data: unknown = await response.json();
  return mapFeedbackSubmission(data);
}

export async function fetchMyFeedback(
  pageUrlOrPath = MY_FEEDBACK_PATH,
): Promise<PaginatedFeedback> {
  const path = evidenceRequestPath(pageUrlOrPath) || MY_FEEDBACK_PATH;
  const response = await apiFetch(path);
  if (!response.ok) {
    throw await readError(response, 'No se pudieron cargar tus comentarios.');
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.results)) {
    return { count: 0, next: null, previous: null, results: [] };
  }

  return {
    count: typeof data.count === 'number' ? data.count : data.results.length,
    next: typeof data.next === 'string' ? data.next : null,
    previous: typeof data.previous === 'string' ? data.previous : null,
    results: data.results.map(mapFeedbackSubmission),
  };
}

export const ADMIN_FEEDBACK_PAGE_SIZE = 10;

/**
 * One page of every feedback submission (admin only), optionally filtered.
 */
export async function fetchAllFeedback({
  category = 'all',
  status = 'all',
  page = 1,
}: AdminFeedbackFilters = {}): Promise<AdminFeedbackPage> {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(ADMIN_FEEDBACK_PAGE_SIZE),
  });
  if (category !== 'all') query.set('category', category);
  if (status !== 'all') query.set('status', status);

  const response = await apiFetch(`${FEEDBACK_PATH}?${query.toString()}`);
  if (!response.ok) {
    throw await readError(response, 'No se pudieron cargar los comentarios.');
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.results)) {
    throw new Error('Respuesta de feedback inválida');
  }
  const count = typeof data.count === 'number' ? data.count : data.results.length;
  return {
    items: data.results.map(mapFeedbackSubmission),
    totalPages: Math.max(1, Math.ceil(count / ADMIN_FEEDBACK_PAGE_SIZE)),
  };
}

/**
 * Change the status and/or admin notes of a submission (admin only).
 */
export async function updateFeedback(
  submissionId: string,
  payload: FeedbackAdminUpdatePayload,
): Promise<FeedbackSubmission> {
  const body: Record<string, string> = {};
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.adminNotes !== undefined) body.admin_notes = payload.adminNotes;

  const response = await apiFetch(`${FEEDBACK_PATH}${encodeURIComponent(submissionId)}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await readError(response, 'No se pudo actualizar el comentario.');
  }
  return mapFeedbackSubmission(await response.json());
}

export function getFeedbackScreenshotUrl(submissionId: string): string {
  return `${getApiBaseUrl()}${FEEDBACK_PATH}${submissionId}/screenshot/`;
}

/**
 * Load the protected feedback screenshot using the stored access token.
 * Supports both direct image byte responses and signed-URL redirects.
 */
export async function fetchFeedbackScreenshotPreview(
  submissionId: string,
): Promise<ScreenshotPreviewSource> {
  const response = await apiFetch(`${FEEDBACK_PATH}${submissionId}/screenshot/`);
  const preview = await readEvidencePreview(response);
  if (!preview) {
    throw new Error(`Error al obtener la captura (${response.status})`);
  }
  if (preview.kind === 'blob') {
    return { url: URL.createObjectURL(preview.blob), revoke: true };
  }
  return { url: preview.url, revoke: false };
}

export async function fetchFeedbackScreenshotBlobUrl(submissionId: string): Promise<string> {
  const preview = await fetchFeedbackScreenshotPreview(submissionId);
  return preview.url;
}
