import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CatalogAction } from '@/types/action-catalog';

interface ActionPickerProps {
  id: string;
  actions: CatalogAction[];
  /** Selected `CatalogAction.id`, or '' when nothing is selected. */
  value: string;
  onChange: (actionId: string) => void;
  isDisabled?: (action: CatalogAction) => boolean;
  invalid?: boolean;
}

/**
 * Select over the master action catalog.
 */
export function ActionPicker({
  id,
  actions,
  value,
  onChange,
  isDisabled,
  invalid,
}: ActionPickerProps) {
  const items = actions.map(action => ({
    value: action.id,
    label: `${action.name} · ${action.points} pts`,
  }));

  return (
    <Select value={value || null} onValueChange={next => onChange(next ?? '')} items={items}>
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className="h-11 w-full min-w-0 rounded-xl px-3"
      >
        <SelectValue placeholder="Selecciona una acción" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="min-w-64">
        {actions.map(action => (
          <SelectItem
            key={action.id}
            value={action.id}
            disabled={isDisabled?.(action) ?? false}
            className="min-h-11"
          >
            {action.name} · {action.points} pts
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
