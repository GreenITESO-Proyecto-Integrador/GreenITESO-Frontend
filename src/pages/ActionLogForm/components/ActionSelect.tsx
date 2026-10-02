import { cn } from '@/lib/utils';
import type { CatalogAction } from '@/types/action-catalog';

interface ActionSelectProps {
  actions: CatalogAction[];
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (actionId: string) => void;
}

/**
 * Native select listing catalog actions and their point values.
 * Labels and control colors follow semantic theme tokens (light/dark).
 */
export function ActionSelect({ actions, value, error, disabled, onChange }: ActionSelectProps) {
  const errorId = 'action-select-error';

  return (
    <div>
      <label htmlFor="action-select" className="mb-2 block text-sm font-semibold text-foreground">
        Acción
      </label>
      <select
        id="action-select"
        name="actionId"
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={event => onChange(event.target.value)}
        className={cn(
          'h-11 w-full min-h-11 rounded-xl border bg-background px-4 text-sm text-foreground transition-all',
          'focus:border-ring focus:ring-2 focus:ring-ring/50 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        <option value="">Selecciona una acción</option>
        {actions.map(action => (
          <option key={action.id} value={action.id}>
            {action.name} · {action.points} pts
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
