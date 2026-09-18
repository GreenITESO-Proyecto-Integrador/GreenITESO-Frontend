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
 */
export function ActionSelect({ actions, value, error, disabled, onChange }: ActionSelectProps) {
  const errorId = 'action-select-error';

  return (
    <div>
      <label
        htmlFor="action-select"
        className="mb-2 block text-sm font-semibold text-secondary-500"
      >
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
          'h-11 w-full min-h-11 rounded-xl border bg-white px-4 text-sm text-secondary-500 transition-all',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-200' : 'border-secondary-100',
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
        <p id={errorId} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
