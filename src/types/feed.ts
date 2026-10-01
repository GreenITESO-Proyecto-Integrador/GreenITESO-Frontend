export type PostType = 'OFFICIAL_ANNOUNCEMENT' | 'COMMUNITY_MILESTONE' | 'SHARED_EVIDENCE';

export interface AuthorInfo {
  id: string | number;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  avatar_url?: string | null;
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
  relative_time?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeedPost[];
}
