import { CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FeedbackSubmission } from '@/types/feedback';

export function StatusBadge({ status }: { status: FeedbackSubmission['status'] }) {
  if (status === 'RESOLVED') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-3" />
        Resuelto
      </Badge>
    );
  }

  if (status === 'IN_REVIEW') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
      >
        <Clock className="size-3" />
        En revisión
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <Clock className="size-3" />
      Recibido
    </Badge>
  );
}
