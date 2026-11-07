import { useEffect, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { getFeed, deletePost, updatePost, togglePostLike } from '@/lib/api/feed';
import { getStoredUser } from '@/lib/auth/session';
import { FeedPost } from './components/FeedPost';
import { CreatePostForm } from './components/CreatePostForm';
import type { FeedPost as FeedPostType } from '@/types/feed';

const FILTER_TABS = [
  { value: '', label: 'Todos' },
  { value: 'SHARED_EVIDENCE', label: 'Evidencias' },
  { value: 'COMMUNITY_MILESTONE', label: 'Hitos' },
  { value: 'OFFICIAL_ANNOUNCEMENT', label: 'Anuncios' },
] as const;

export function FeedPage() {
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [ordering, setOrdering] = useState<'recent' | 'popular'>('recent');

  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id;

  useEffect(() => {
    let active = true;
    async function loadFeed() {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeed(1, selectedType || undefined, ordering);
        if (active) {
          setPosts(data.results);
        }
      } catch (err) {
        if (active) {
          setError('Error al cargar el muro social.');
        }
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadFeed();
    return () => {
      active = false;
    };
  }, [selectedType, ordering]);

  const handlePostCreated = (newPost: FeedPostType) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostDeleted = async (postId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;

    try {
      await deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      alert('No se pudo eliminar la publicación.');
      console.error(err);
    }
  };

  const handlePostUpdated = async (postId: number, newContent: string) => {
    try {
      const updatedPost = await updatePost(postId, { content: newContent });
      setPosts(prevPosts => prevPosts.map(post => (post.id === postId ? updatedPost : post)));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleLike = async (postId: number) => {
    // Optimistic UI update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id !== postId) return post;
        const currentlyLiked = Boolean(post.liked_by_me);
        const currentCount = post.likes_count ?? 0;
        return {
          ...post,
          liked_by_me: !currentlyLiked,
          likes_count: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
        };
      }),
    );

    try {
      const result = await togglePostLike(postId);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, liked_by_me: result.liked_by_me, likes_count: result.likes_count }
            : post,
        ),
      );
    } catch (err) {
      console.error(err);
      // Rollback on error
      const data = await getFeed(1, selectedType || undefined, ordering);
      setPosts(data.results);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div data-tour="feed-overview">
        <h1 className="text-2xl font-bold text-foreground">Muro Social</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Lo que la comunidad GreenITESO está logrando en este momento.
        </p>
      </div>

      <CreatePostForm onPostCreated={handlePostCreated} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedType(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === tab.value
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex w-full sm:w-auto items-center gap-1 bg-muted/40 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setOrdering('recent')}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors ${
              ordering === 'recent'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Recientes
          </button>
          <button
            type="button"
            onClick={() => setOrdering('popular')}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors ${
              ordering === 'popular'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Populares
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-10 animate-pulse">
          Cargando publicaciones...
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-10 bg-destructive/10 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay publicaciones por mostrar. ¡Sé el primero en compartir tu impacto!
            </p>
          ) : (
            posts.map(post => (
              <FeedPost
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onDelete={handlePostDeleted}
                onUpdate={handlePostUpdated}
                onToggleLike={handleToggleLike}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
