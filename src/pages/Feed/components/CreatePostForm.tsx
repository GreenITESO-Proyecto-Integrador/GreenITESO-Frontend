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
      className="mb-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-4 transition-colors"
    >
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="¿Qué acción sostenible realizaste hoy?"
        className="w-full bg-muted/50 border border-input rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background transition-all resize-none min-h-[100px]"
        disabled={isSubmitting}
      />

      {showImageInput && (
        <input
          type="url"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="Pega la URL de tu imagen aquí (opcional)"
          className="w-full mt-3 bg-muted/50 border border-input rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background transition-all"
          disabled={isSubmitting}
        />
      )}

      {error && <p className="text-destructive text-xs mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowImageInput(!showImageInput)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            showImageInput
              ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          disabled={isSubmitting}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Añadir imagen</span>
        </button>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {isSubmitting ? 'Publicando...' : 'Publicar'}
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
