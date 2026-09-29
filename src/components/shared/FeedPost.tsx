import { Award, MoreVertical, Pencil, Sparkles, Target, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/utils';
import type { Post, PostType } from '@/types/feed';

interface FeedPostProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

const TYPE_META: Record<PostType, { label: string; icon: typeof Sparkles }> = {
  ACTION_LOG: { label: 'Acción registrada', icon: Target },
  MISSION_COMPLETED: { label: 'Misión completada', icon: Award },
  ACHIEVEMENT: { label: 'Logro desbloqueado', icon: Sparkles },
  GENERAL: { label: 'Publicación', icon: Sparkles },
};

function initialsFrom(nickname: string) {
  return nickname.slice(0, 2).toUpperCase();
}

export function FeedPost({ post, onEdit, onDelete }: FeedPostProps) {
  const { label: typeLabel, icon: TypeIcon } = TYPE_META[post.type];
  const canManage = Boolean(onEdit || onDelete);

  return (
    <Card className="gap-3 rounded-2xl bg-card py-4 shadow-sm ring-1 ring-border">
      <CardHeader className="px-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author.avatarUrl} alt={post.author.nickname} />
              <AvatarFallback>{initialsFrom(post.author.nickname)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {post.author.nickname}
              </p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
            </div>
          </div>

          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                    <MoreVertical />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {onEdit ? (
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Pencil />
                    Editar
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(post)}>
                    <Trash2 />
                    Eliminar
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        <Badge variant="secondary" className="w-fit gap-1">
          <TypeIcon />
          {typeLabel}
        </Badge>

        <p className="text-sm text-foreground sm:text-base">{post.content}</p>

        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt=""
            className="max-h-96 w-full rounded-xl object-cover ring-1 ring-border"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
