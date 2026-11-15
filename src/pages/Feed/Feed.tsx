import { useEffect, useRef, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { getFeed, deletePost, updatePost, setPostLike } from '@/lib/api/feed';
import { getStoredUser } from '@/lib/auth/session';
import { FeedPost } from './components/FeedPost';
import { CreatePostForm } from './components/CreatePostForm';
import type { FeedOrdering, FeedPost as FeedPostType, PostLikeState, PostType } from '@/types/feed';

const FILTER_TABS: readonly { value: PostType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'SHARED_EVIDENCE', label: 'Evidencias' },
  { value: 'COMMUNITY_MILESTONE', label: 'Hitos' },
  { value: 'OFFICIAL_ANNOUNCEMENT', label: 'Anuncios' },
];

export function FeedPage() {
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PostType | ''>('');
  const [ordering, setOrdering] = useState<FeedOrdering>('recent');
  const pendingLikesRef = useRef(new Set<number>());
  const [pendingLikeIds, setPendingLikeIds] = useState<ReadonlySet<number>>(() => new Set());
  const [likeError, setLikeError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Why the post the user just created is not in the visible list, if it is not. */
  const [hiddenNewPost, setHiddenNewPost] = useState<'type' | 'ordering' | null>(null);

  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id;

  useEffect(() => {
    // `active` drops the response of a filter the user already left.
    let active = true;
    async function loadFeed() {
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
          setIsRefreshing(false);
        }
      }
    }
    loadFeed();
    return () => {
      active = false;
    };
  }, [selectedType, ordering]);

  const changeFilters = (next: { type?: PostType | ''; ordering?: FeedOrdering }) => {
    const nextType = next.type ?? selectedType;
    const nextOrdering = next.ordering ?? ordering;
    if (nextType === selectedType && nextOrdering === ordering) return;

    setSelectedType(nextType);
    setOrdering(nextOrdering);
    // Keep the current list on screen (marked busy) instead of blanking it on every click.
    setIsRefreshing(true);
    setError(null);
    setLikeError(null);
    setHiddenNewPost(null);
  };

  const handlePostCreated = (newPost: FeedPostType) => {
    const matchesType = selectedType === '' || newPost.post_type === selectedType;
    if (matchesType && ordering === 'recent') {
      setHiddenNewPost(null);
      setPosts(prevPosts => [newPost, ...prevPosts]);
      return;
    }
    // Prepending it here would show a post the active filter or order does not contain.
    setHiddenNewPost(matchesType ? 'ordering' : 'type');
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

  const patchLikeState = (postId: number, state: PostLikeState) => {
    setPosts(prevPosts =>
      prevPosts.map(post => (post.id === postId ? { ...post, ...state } : post)),
    );
  };

  const handleToggleLike = async (postId: number) => {
    // The ref blocks a second click before React re-renders the disabled button.
    if (pendingLikesRef.current.has(postId)) return;
    const target = posts.find(post => post.id === postId);
    if (!target) return;

    const previous: PostLikeState = {
      liked_by_me: Boolean(target.liked_by_me),
      likes_count: target.likes_count ?? 0,
    };
    const wantLiked = !previous.liked_by_me;

    pendingLikesRef.current.add(postId);
    setPendingLikeIds(new Set(pendingLikesRef.current));
    setLikeError(null);
    patchLikeState(postId, {
      liked_by_me: wantLiked,
      likes_count: Math.max(0, previous.likes_count + (wantLiked ? 1 : -1)),
    });

    try {
      patchLikeState(postId, await setPostLike(postId, wantLiked));
    } catch (err) {
      console.error(err);
      // Undo only this post, and only if nothing newer (a refetch) replaced the optimistic value.
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId && Boolean(post.liked_by_me) === wantLiked
            ? { ...post, ...previous }
            : post,
        ),
      );
      setLikeError('No se pudo registrar tu Like. Intenta de nuevo.');
    } finally {
      pendingLikesRef.current.delete(postId);
      setPendingLikeIds(new Set(pendingLikesRef.current));
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

      {hiddenNewPost && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700 sm:flex-row sm:items-center sm:justify-between dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300"
        >
          <p>Tu publicación se creó, pero no aparece con el filtro u orden que tienes activo.</p>
          <button
            type="button"
            onClick={() => changeFilters({ type: '', ordering: 'recent' })}
            className="min-h-11 shrink-0 rounded-lg bg-primary-500 px-4 font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {hiddenNewPost === 'type' ? 'Ver en Todos' : 'Ver en Recientes'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeFilters({ type: tab.value })}
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
            onClick={() => changeFilters({ ordering: 'recent' })}
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
            onClick={() => changeFilters({ ordering: 'popular' })}
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
        <div
          aria-busy={isRefreshing}
          className={`flex flex-col gap-4 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}
        >
          {likeError && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {likeError}
            </p>
          )}
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
                isLikePending={pendingLikeIds.has(post.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
