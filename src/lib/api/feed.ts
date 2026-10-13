import { apiFetch } from './client';
import type { FeedResponse, PostType } from '@/types/feed';

export async function getFeed(page = 1, postType?: string): Promise<FeedResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (postType) params.append('post_type', postType);

  const response = await apiFetch(`/api/v1/feed/?${params.toString()}`);
  if (!response.ok) throw new Error('Fallo al obtener el feed social');
  return response.json();
}

// CREATE:
export async function createPost(data: {
  content: string;
  post_type: PostType;
  image_url?: string;
  badge_user?: string;
}) {
  const response = await apiFetch('/api/v1/feed/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Error al crear la publicación');
  }

  return response.json();
}

// DELETE:
export async function deletePost(postId: number) {
  const response = await apiFetch(`/api/v1/feed/${postId}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al eliminar la publicación');
  }

  return true;
}

// UPDATE:
export async function updatePost(postId: number, data: { content: string }) {
  const response = await apiFetch(`/api/v1/feed/${postId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Error al actualizar la publicación');
  }

  return response.json();
}
