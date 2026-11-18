import { cn } from '@/lib/utils';
import type { FeedbackStatus } from '@/types/feedback';
import { STATUS_STYLES } from '../../Feedback/components/feedback-statuses';

const STATUS_ORDER: readonly FeedbackStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

interface FeedbackStatusPickerProps {
  label: string;
  value: FeedbackStatus;
  onChange: (value: FeedbackStatus) => void;
  disabled?: boolean;
}

/**
 * Status as clickable badges of equal width that fill the row; the selected one is filled with
 * its status color.
 */
export function FeedbackStatusPicker({
  label,
  value,
  onChange,
  disabled = false,
}: FeedbackStatusPickerProps) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-2">
      {STATUS_ORDER.map(optionValue => {
        const option = STATUS_STYLES[optionValue];
        const selected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            className={cn(
              'inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              selected
                ? option.classes
                : 'border-border bg-card text-muted-foreground hover:border-secondary-200 hover:text-foreground',
            )}
          >
            <option.icon className="size-3.5 shrink-0" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
