import { CheckCircle2, Clock } from 'lucide-react';
import type { FeedbackStatus } from '@/types/feedback';

/** Label, icon and badge/chip colors per status; shared by badges, pickers and filters. */
export const STATUS_STYLES: Record<
  FeedbackStatus,
  { label: string; icon: typeof Clock; classes: string }
> = {
  OPEN: {
    label: 'Recibido',
    icon: Clock,
    classes:
      'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  IN_REVIEW: {
    label: 'En revisión',
    icon: Clock,
    classes:
      'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  },
  RESOLVED: {
    label: 'Resuelto',
    icon: CheckCircle2,
    classes:
      'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};
