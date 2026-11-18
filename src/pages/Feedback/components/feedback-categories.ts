import { AlertTriangle, Eye, Leaf, MessageSquare, Sparkles } from 'lucide-react';
import type { FeedbackCategory } from '@/types/feedback';

export const CATEGORY_NAMES: Record<string, string> = {
  BUG: 'Error técnico',
  IDEA: 'Idea o mejora',
  ECO_ACTION: 'Acción eco',
  ACCESSIBILITY: 'Accesibilidad',
  OTHER: 'Comentario',
};

/** Icon and badge/chip colors per category (selected chips reuse the badge colors). */
export const CATEGORY_STYLES: Record<FeedbackCategory, { icon: typeof Leaf; classes: string }> = {
  BUG: {
    icon: AlertTriangle,
    classes:
      'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
  IDEA: {
    icon: Sparkles,
    classes:
      'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },
  ECO_ACTION: {
    icon: Leaf,
    classes:
      'border-lime-300 bg-lime-50 text-lime-800 dark:border-lime-800 dark:bg-lime-950/40 dark:text-lime-300',
  },
  ACCESSIBILITY: {
    icon: Eye,
    classes:
      'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  OTHER: {
    icon: MessageSquare,
    classes:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
};
