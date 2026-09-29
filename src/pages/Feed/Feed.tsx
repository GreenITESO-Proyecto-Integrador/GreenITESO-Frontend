import { useEffect, useState } from 'react';
import { getFeed, deletePost, updatePost } from '@/lib/api/feed';
import { FeedPost } from './components/FeedPost';
import { CreatePostForm } from './components/CreatePostForm';
import type { FeedPost as FeedPostType } from '@/types/feed';

export function FeedPage() {
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        const data = await getFeed(1);
        setPosts(data.results);
      } catch (err) {
        setError('Error al cargar el muro social.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const handlePostCreated = (newPost: FeedPostType) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handlePostDeleted = async (postId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;
    
    try {
      await deletePost(postId);
      // Removemos el post del estado local para que desaparezca de la pantalla
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      alert('No se pudo eliminar la publicación.');
      console.error(err);
    }
  };

  const handlePostUpdated = async (postId: number, newContent: string) => {
    try {
      const updatedPost = await updatePost(postId, { content: newContent });
      // Reemplazamos el post antiguo con la versión actualizada que nos devuelve el backend
      setPosts(prevPosts => prevPosts.map(post => post.id === postId ? updatedPost : post));
    } catch (err) {
      console.error(err);
      throw err; // Lanzamos el error para que FeedPost lo atrape y muestre la alerta
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Muro Social</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Lo que la comunidad GreenITESO está logrando en este momento.
        </p>
      </div>

      <CreatePostForm onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="text-center text-muted-foreground py-10 animate-pulse">Cargando publicaciones...</div>
      ) : error ? (
        <div className="text-center text-destructive py-10 bg-destructive/10 rounded-lg">{error}</div>
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
                currentUserId="58b92fca-dceb-468a-baa5-ec3eceacedc2" // TODO: Extraer el ID real de la sesión o contexto de autenticación
                onDelete={handlePostDeleted} 
                onUpdate={handlePostUpdated}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}