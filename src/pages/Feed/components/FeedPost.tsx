import { Megaphone, Trophy, Camera, Clock } from 'lucide-react';
import type { FeedPost as FeedPostType } from '@/types/feed';

interface FeedPostProps {
  post: FeedPostType;
}

const typeConfig = {
  OFFICIAL_ANNOUNCEMENT: { icon: Megaphone, color: 'bg-blue-100 text-blue-800', label: 'Anuncio Oficial' },
  COMMUNITY_MILESTONE: { icon: Trophy, color: 'bg-yellow-100 text-yellow-800', label: 'Hito Comunitario' },
  SHARED_EVIDENCE: { icon: Camera, color: 'bg-green-100 text-green-800', label: 'Evidencia Compartida' },
};

export function FeedPost({ post }: FeedPostProps) {
  const config = typeConfig[post.post_type] || typeConfig.SHARED_EVIDENCE;
  const Icon = config.icon;

  const dateObj = new Date(post.created_at);
  const formattedDate = dateObj.toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

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
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{config.label}</span>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
            <img src={post.image_url} alt="Evidencia" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}
        
        {post.badge && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-3 border border-green-100">
            <span className="text-2xl">{post.badge.icon}</span>
            <span className="font-medium text-sm text-green-800">
              ¡Obtuvo la insignia: <strong>{post.badge.title}</strong>!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}