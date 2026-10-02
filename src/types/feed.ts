// src/types/feed.ts

export type PostType =
  | 'OFFICIAL_ANNOUNCEMENT'
  | 'COMMUNITY_MILESTONE'
  | 'SHARED_EVIDENCE'
  | 'ACTION_LOG'
  | 'MISSION_COMPLETED'
  | 'ACHIEVEMENT'
  | 'GENERAL';

export interface AuthorInfo {
  id: number;
  nickname: string;
  avatar_url: string | null;
}

export interface BadgeInfo {
  title: string;
  icon: string;
}

export interface FeedPost {
  id: number;
  author_id: string;
  author: AuthorInfo; // Información del autor incluida por el serializador
  post_type: PostType;
  content: string;
  image_url?: string | null;
  badge_user_id?: number | null;
  badge?: BadgeInfo; // Información de la insignia si existe
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string | number;
  author: {
    id?: string | number;
    nickname: string;
    avatarUrl?: string;
  };
  createdAt: string;
  content: string;
  type: PostType;
  imageUrl?: string | null;
}

export interface FeedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeedPost[];
}
