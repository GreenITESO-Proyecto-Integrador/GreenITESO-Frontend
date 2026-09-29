import { apiFetch } from './client';
import type { FeedResponse } from '@/types/feed'; // El tipo que creamos en el paso anterior

export async function getFeed(page = 1, postType?: string): Promise<FeedResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  
  if (postType) {
    params.append('post_type', postType);
  }

  // apiFetch automáticamente agregará la base URL (http://localhost:8000)
  const response = await apiFetch(`/api/v1/feed/?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Fallo al obtener el feed social');
  }
  
  return response.json();
}