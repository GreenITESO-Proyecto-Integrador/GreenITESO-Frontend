export type PostType =
  | 'OFFICIAL_ANNOUNCEMENT'
  | 'COMMUNITY_MILESTONE'
  | 'SHARED_EVIDENCE'
  | 'ACTION_LOG'
  | 'MISSION_COMPLETED'
  | 'ACHIEVEMENT'
  | 'GENERAL';

/** Listing order accepted by `GET /api/v1/feed/?ordering=`. */
export type FeedOrdering = 'recent' | 'popular';

/** Like state of a post as the backend confirms it after a like or unlike. */
export interface PostLikeState {
  liked_by_me: boolean;
  likes_count: number;
}

export interface AuthorInfo {
  id: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  display_name?: string;
  avatar_url?: string | null;
  /** Image of the author's active avatar frame; empty when none. */
  frame_url?: string | null;
  /** Image of the author's active profile background; empty when none. */
  background_url?: string | null;
}

export interface BadgeInfo {
  id: string;
  user_badge_id?: string;
  name: string;
  description: string;
  icon_name?: string;
  earned_at?: string;
}

export interface FeedPost {
  id: number;
  author_id?: string | number | null;
  author: AuthorInfo | null;
  post_type: PostType;
  content: string;
  image_url?: string | null;
  badge_user?: string | null;
  badge_info?: BadgeInfo | null;
  likes_count?: number;
  liked_by_me?: boolean;
  relative_time?: string;
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
