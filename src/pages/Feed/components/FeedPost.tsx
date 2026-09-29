import { useState } from 'react';
import { Megaphone, Trophy, Camera, Clock, Trash2, Edit2, X, Check } from 'lucide-react';
import type { FeedPost as FeedPostType } from '@/types/feed';

interface FeedPostProps {
  post: FeedPostType;
  currentUserId?: string;
  onDelete?: (postId: number) => void;
  onUpdate?: (postId: number, newContent: string) => Promise<void>;
}

const typeConfig = {
  OFFICIAL_ANNOUNCEMENT: { icon: Megaphone, color: 'bg-blue-100 text-blue-800', label: 'Anuncio Oficial' },
  COMMUNITY_MILESTONE: { icon: Trophy, color: 'bg-yellow-100 text-yellow-800', label: 'Hito Comunitario' },
  SHARED_EVIDENCE: { icon: Camera, color: 'bg-green-100 text-green-800', label: 'Evidencia Compartida' },
};

export function FeedPost({ post, currentUserId, onDelete, onUpdate }: FeedPostProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  const config = typeConfig[post.post_type] || typeConfig.SHARED_EVIDENCE;
  const Icon = config.icon;

  const dateObj = new Date(post.created_at);
  const formattedDate = dateObj.toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isAuthor = currentUserId === post.author_id;

  const handleSave = async () => {
    if (!onUpdate || !editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onUpdate(post.id, editContent);
      setIsEditing(false);
    } catch (error) {
      alert('Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 flex flex-row items-center gap-4 border-b border-gray-50">
        <div className="w-12 h-12 rounded-full bg-green-100 overflow-hidden flex items-center justify-center shrink-0">
          {post.author?.avatar_url ? (
            <img src={post.author.avatar_url} alt={post.author.nickname} className="w-full h-full object-cover" />
          ) : (
            <span className="text-green-700 font-bold text-lg">
              {post.author?.nickname?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{post.author?.nickname || 'Usuario Ecológico'}</h3>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {formattedDate}
            {post.updated_at !== post.created_at && <span className="ml-1 italic">(Editado)</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{config.label}</span>
          </div>
          
          {isAuthor && !isEditing && (
            <div className="flex items-center ml-1 border-l border-gray-200 pl-2 gap-1">
              {onUpdate && (
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar publicación">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar publicación">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]"
              disabled={isSaving}
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} disabled={isSaving} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving || !editContent.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-md transition-colors">
                <Check className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        )}
        
        {post.image_url && !isEditing && (
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
            <img src={post.image_url} alt="Evidencia" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}
      </div>
    </div>
  );
}