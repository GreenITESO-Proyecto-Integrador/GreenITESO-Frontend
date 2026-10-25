import { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Upload, X, Link as LinkIcon } from 'lucide-react';
import { createPost } from '@/lib/api/feed';
import { uploadImage, validateImageFile } from '@/lib/api/upload';
import type { FeedPost } from '@/types/feed';

interface CreatePostFormProps {
  onPostCreated: (newPost: FeedPost) => void;
}

type ImageSourceMode = 'upload' | 'url';

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<ImageSourceMode>('upload');
  const [showImageSection, setShowImageSection] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Archivo inválido');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setContent('');
    handleRemoveImage();
    setShowImageSection(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let finalImageUrl: string | undefined = undefined;

      if (imageMode === 'upload' && selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      } else if (imageMode === 'url' && imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      const newPost = await createPost({
        content: content.trim(),
        post_type: 'SHARED_EVIDENCE',
        image_url: finalImageUrl,
      });

      onPostCreated(newPost);
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Hubo un problema al publicar. Intenta de nuevo.');
      }
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

      {showImageSection && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                imageMode === 'upload'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Subir archivo
            </button>
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                imageMode === 'url'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Enlace URL
            </button>
          </div>

          {imageMode === 'upload' ? (
            <div>
              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 p-2 flex justify-center items-center">
                  <img
                    src={previewUrl}
                    alt="Previsualización de evidencia"
                    className="max-h-56 w-auto object-contain rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    aria-label="Eliminar imagen seleccionada"
                    className="absolute top-3 right-3 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md border border-border backdrop-blur-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-primary-500 bg-primary-500/10 dark:border-primary-400 dark:bg-primary-900/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  <Upload
                    className={`w-8 h-8 mb-2 ${
                      isDragging ? 'text-primary-500' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="text-sm font-medium text-foreground text-center">
                    Arrastra tu foto de evidencia aquí o{' '}
                    <span className="text-primary-500 underline font-semibold">
                      explora archivos
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP (Máx. 5 MB)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/evidencia.jpg"
                className="w-full bg-muted/50 border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background transition-all"
                disabled={isSubmitting}
              />
              <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-destructive text-xs mt-2 font-medium">{error}</p>}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowImageSection(!showImageSection)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            showImageSection
              ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          disabled={isSubmitting}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">
            {showImageSection ? 'Ocultar imagen' : 'Añadir imagen'}
          </span>
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
