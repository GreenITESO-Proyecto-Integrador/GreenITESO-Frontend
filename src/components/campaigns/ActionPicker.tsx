import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CatalogAction } from '@/types/action-catalog';
import { SELECT_ITEM_CLASS } from './field-limits';

interface ActionPickerProps {
  id: string;
  actions: CatalogAction[];
  /** Selected `CatalogAction.id`, or '' when nothing is selected. */
  value: string;
  onChange: (actionId: string) => void;
  isDisabled?: (action: CatalogAction) => boolean;
  invalid?: boolean;
}

const PLACEHOLDER = 'Selecciona una acción';

/**
 * Select over the master action catalog. The chosen action is truncated to one line in the
 * trigger so the field keeps its size; the full name shows in the list.
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
        className="h-11 w-full min-w-0 overflow-hidden rounded-xl px-3"
      >
        <SelectValue className="min-w-0 overflow-hidden" placeholder={PLACEHOLDER}>
          {(selected: string | null) => {
            const label = items.find(item => item.value === selected)?.label;
            return label ? (
              <span className="block min-w-0 truncate" title={label}>
                {label}
              </span>
            ) : (
              <span className="text-muted-foreground">{PLACEHOLDER}</span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="min-w-64">
        {actions.map(action => (
          <SelectItem
            key={action.id}
            value={action.id}
            disabled={isDisabled?.(action) ?? false}
            className={SELECT_ITEM_CLASS}
          >
            {action.name} · {action.points} pts
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
