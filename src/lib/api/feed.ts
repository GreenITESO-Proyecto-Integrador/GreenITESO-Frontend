import { apiFetch } from './client';
import type { FeedOrdering, FeedResponse, PostLikeState, PostType } from '@/types/feed';

export async function getFeed(
  page = 1,
  postType?: PostType,
  ordering?: FeedOrdering,
): Promise<FeedResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (postType) params.append('post_type', postType);
  if (ordering === 'popular') params.append('ordering', 'popular');

  const response = await apiFetch(`/api/v1/feed/?${params.toString()}`);
  if (!response.ok) throw new Error('Fallo al obtener el feed social');
  return response.json();
}

function readLikeState(payload: unknown): PostLikeState {
  if (typeof payload === 'object' && payload !== null) {
    const { liked_by_me: likedByMe, likes_count: likesCount } = payload as Record<string, unknown>;
    if (typeof likedByMe === 'boolean' && typeof likesCount === 'number') {
      return { liked_by_me: likedByMe, likes_count: likesCount };
    }
  }
  throw new Error('Respuesta inesperada al reaccionar a la publicación');
}

/**
 * Set whether the current user likes a post: `POST` likes it and `DELETE` removes the like.
 *
 * Both requests are idempotent on the backend, so a retry never undoes the user's choice.
 */
export async function setPostLike(postId: number, liked: boolean): Promise<PostLikeState> {
  const response = await apiFetch(`/api/v1/feed/${postId}/like/`, {
    method: liked ? 'POST' : 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al reaccionar a la publicación');
  }

  return readLikeState(await response.json());
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
