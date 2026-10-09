import { useState } from 'react';
import {
  Megaphone,
  Trophy,
  Camera,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  Award,
  Leaf,
  Recycle,
  TreePine,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { FeedPost as FeedPostType } from '@/types/feed';

interface FeedPostProps {
  post: FeedPostType;
  currentUserId?: string;
  onDelete?: (postId: number) => void;
  onUpdate?: (postId: number, newContent: string) => Promise<void>;
}

const typeConfig = {
  OFFICIAL_ANNOUNCEMENT: {
    icon: Megaphone,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900',
    label: 'Anuncio Oficial',
  },
  COMMUNITY_MILESTONE: {
    icon: Trophy,
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
    label: 'Hito Comunitario',
  },
  SHARED_EVIDENCE: {
    icon: Camera,
    color:
      'bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
    label: 'Evidencia Compartida',
  },
};

const BADGE_ICONS = new Map<string, LucideIcon>([
  ['leaf', Leaf],
  ['recycle', Recycle],
  ['tree', TreePine],
  ['tree-pine', TreePine],
  ['trophy', Trophy],
  ['shield', ShieldCheck],
]);

function getBadgeIcon(iconName?: string): LucideIcon {
  if (!iconName) return Award;
  return BADGE_ICONS.get(iconName.toLowerCase()) ?? Award;
}

export function FeedPost({ post, currentUserId, onDelete, onUpdate }: FeedPostProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  const config =
    (typeConfig as Record<string, (typeof typeConfig)[keyof typeof typeConfig]>)[post.post_type] ||
    typeConfig.SHARED_EVIDENCE;
  const TypeIcon = config.icon;
  const BadgeIcon = getBadgeIcon(post.badge_info?.icon_name);

  const authorName =
    [post.author?.first_name, post.author?.last_name].filter(Boolean).join(' ') ||
    post.author?.nickname ||
    'Usuario Ecológico';

  const dateObj = new Date(post.created_at);
  const formattedDate = dateObj.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const timeLabel = post.relative_time || formattedDate;

  const isAuthor = Boolean(
    currentUserId && post.author_id && String(currentUserId) === String(post.author_id),
  );

  const handleSave = async () => {
    if (!onUpdate || !editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(post.id, editContent);
      setIsEditing(false);
    } catch {
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
    <div className="mb-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden transition-colors">
      <div className="p-4 flex flex-row items-center gap-4 border-b border-border/60">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 overflow-hidden flex items-center justify-center shrink-0">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">
              {authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{authorName}</h3>
            {post.badge_info && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80"
                title={post.badge_info.description}
              >
                <BadgeIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {post.badge_info.name}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3 mr-1 shrink-0" />
            {timeLabel}
            {post.updated_at !== post.created_at && <span className="ml-1 italic">(Editado)</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${config.color}`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{config.label}</span>
          </div>

          {isAuthor && !isEditing && (
            <div className="flex items-center ml-1 border-l border-border pl-2 gap-1">
              {onUpdate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Editar publicación"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(post.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Eliminar publicación"
                >
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
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-muted/50 border border-input rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[80px]"
              disabled={isSaving}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editContent.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-md transition-colors"
              >
                <Check className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        )}

        {post.image_url && !isEditing && (
          <div className="mt-4 rounded-lg overflow-hidden border border-border bg-muted/40">
            <img
              src={post.image_url}
              alt="Evidencia"
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
      </div>
    </div>
  );
}
