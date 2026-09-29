import { useEffect, useState } from 'react';
import { getFeed } from '@/lib/api/feed';
import { FeedPost } from './components/FeedPost';
import { CreatePostForm } from './components/CreatePostForm'; // 1. IMPORTAR AQUÍ
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

  // 2. FUNCIÓN PARA AGREGAR EL POST NUEVO AL ESTADO
  const handlePostCreated = (newPost: FeedPostType) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto w-full pb-20">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">Muro Social</h1>
      
      {/* 3. AGREGAR EL COMPONENTE FORMULARIO */}
      <CreatePostForm onPostCreated={handlePostCreated} />
      
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">Cargando publicaciones...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10 bg-red-50 rounded-lg">{error}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.length === 0 && (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-4 text-center border border-blue-100">
              Aún no hay publicaciones. ¡Sé el primero en compartir tu impacto!
            </div>
          )}
          {posts.map(post => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}