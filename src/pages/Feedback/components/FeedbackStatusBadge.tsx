import { Badge } from '@/components/ui/badge';
import type { FeedbackSubmission } from '@/types/feedback';
import { STATUS_STYLES } from './feedback-statuses';

export function StatusBadge({ status }: { status: FeedbackSubmission['status'] }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.OPEN;
  return (
    <Badge variant="outline" className={`gap-1 ${style.classes}`}>
      <style.icon className="size-3" />
      {style.label}
    </Badge>
  );
}
