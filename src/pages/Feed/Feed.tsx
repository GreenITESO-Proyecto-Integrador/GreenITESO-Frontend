import { useState } from 'react';
import { FeedPost } from '@/components/shared/FeedPost';
import { mockPosts } from '@/pages/Feed/mock-data';
import type { Post } from '@/types/feed';

const CURRENT_USER_ID = 'user-2';

export function FeedPage() {
  const [posts, setPosts] = useState(mockPosts);

  const handleDelete = (post: Post) => {
    setPosts(current => current.filter(item => item.id !== post.id));
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Lo que la comunidad GreenITESO está logrando en este momento.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <FeedPost
            key={post.id}
            post={post}
            onDelete={post.author.id === CURRENT_USER_ID ? handleDelete : undefined}
          />
        ))}

        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay publicaciones por mostrar.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default FeedPage;
