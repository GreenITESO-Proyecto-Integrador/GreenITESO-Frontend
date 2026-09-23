export type PostType = 'ACTION_LOG' | 'MISSION_COMPLETED' | 'ACHIEVEMENT' | 'GENERAL';

export interface PostAuthor {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  createdAt: string;
  content: string;
  imageUrl?: string;
  type: PostType;
}
