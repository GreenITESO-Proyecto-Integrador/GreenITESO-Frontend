import { Award, BellRing, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { NotificationType } from '@/types/notification';

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { icon: typeof BellRing; className: string }
> = {
  MISSION: {
    icon: Sparkles,
    className: 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  },
  AUDIT: {
    icon: ShieldCheck,
    className: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  ACHIEVEMENT: {
    icon: Award,
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  SOCIAL: {
    icon: Users,
    className: 'bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  },
  SYSTEM: {
    icon: BellRing,
    className: 'bg-muted text-muted-foreground',
  },
};
