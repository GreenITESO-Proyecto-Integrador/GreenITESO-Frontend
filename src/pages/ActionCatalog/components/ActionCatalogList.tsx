import type { CatalogAction } from '@/types/action-catalog';
import { ActionCatalogCard } from './ActionCatalogCard';

interface ActionCatalogListProps {
  actions: CatalogAction[];
}

/**
 * Responsive grid of catalog action cards.
 */
export function ActionCatalogList({ actions }: ActionCatalogListProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map(action => (
        <li key={action.id || action.code} className="flex">
          <ActionCatalogCard action={action} />
        </li>
      ))}
    </ul>
  );
}
