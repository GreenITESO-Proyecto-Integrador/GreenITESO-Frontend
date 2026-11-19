import { Badge } from '@/components/ui/badge';
import type { FeedbackCategory } from '@/types/feedback';
import { CATEGORY_NAMES, CATEGORY_STYLES } from './feedback-categories';

/**
 * Feedback type as a colored badge (icon + name). Unknown values render as neutral "Otro".
 */
export function FeedbackCategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category as FeedbackCategory] ?? CATEGORY_STYLES.OTHER;
  return (
    <Badge variant="outline" className={`gap-1 ${style.classes}`}>
      <style.icon className="size-3" />
      {CATEGORY_NAMES[category] || category}
    </Badge>
  );
}
