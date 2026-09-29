import { useState } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { createPost } from '@/lib/api/feed';
import type { FeedPost } from '@/types/feed';

interface CreatePostFormProps {
  onPostCreated: (newPost: FeedPost) => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newPost = await createPost({
        content: content.trim(),
        post_type: 'SHARED_EVIDENCE', // Por defecto los usuarios comparten evidencias
        image_url: imageUrl.trim() || undefined,
      });

      onPostCreated(newPost);
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
    } catch (err) {
      setError('Hubo un problema al publicar. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4"
    >
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="¿Qué acción sostenible realizaste hoy?"
        className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none min-h-[100px]"
        disabled={isSubmitting}
      />

      {showImageInput && (
        <input
          type="url"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="Pega la URL de tu imagen aquí (opcional)"
          className="w-full mt-3 bg-gray-50 border border-gray-100 rounded-lg p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          disabled={isSubmitting}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowImageInput(!showImageInput)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            showImageInput ? 'text-green-700 bg-green-50' : 'text-gray-500 hover:bg-gray-50'
          }`}
          disabled={isSubmitting}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Añadir imagen</span>
        </button>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          {isSubmitting ? 'Publicando...' : 'Publicar'}
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
