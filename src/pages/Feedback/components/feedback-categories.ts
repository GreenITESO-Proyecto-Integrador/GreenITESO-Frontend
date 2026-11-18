import { AlertTriangle, Eye, Leaf, MessageSquare, Sparkles } from 'lucide-react';
import type { FeedbackCategory } from '@/types/feedback';

export const CATEGORY_NAMES: Record<string, string> = {
  BUG: 'Error técnico',
  IDEA: 'Idea o mejora',
  ECO_ACTION: 'Acción eco',
  ACCESSIBILITY: 'Accesibilidad',
  OTHER: 'Otro comentario',
};

/**
 * Icon and colors per category: `classes` for badges, chips and icon tiles; `card` for the
 * selected card in the form's category picker.
 */
export const CATEGORY_STYLES: Record<
  FeedbackCategory,
  { icon: typeof Leaf; classes: string; card: string }
> = {
  BUG: {
    icon: AlertTriangle,
    classes:
      'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
    card: 'border-red-400 bg-red-50/70 ring-2 ring-red-500/20 dark:border-red-700 dark:bg-red-950/30',
  },
  IDEA: {
    icon: Sparkles,
    classes:
      'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
    card: 'border-fuchsia-400 bg-fuchsia-50/70 ring-2 ring-fuchsia-500/20 dark:border-fuchsia-700 dark:bg-fuchsia-950/30',
  },
  ECO_ACTION: {
    icon: Leaf,
    classes:
      'border-lime-300 bg-lime-50 text-lime-800 dark:border-lime-800 dark:bg-lime-950/40 dark:text-lime-300',
    card: 'border-lime-400 bg-lime-50/70 ring-2 ring-lime-500/20 dark:border-lime-700 dark:bg-lime-950/30',
  },
  ACCESSIBILITY: {
    icon: Eye,
    classes:
      'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    card: 'border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-700 dark:bg-indigo-950/30',
  },
  OTHER: {
    icon: MessageSquare,
    classes:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
    card: 'border-slate-400 bg-slate-50/70 ring-2 ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950/30',
  },
};
