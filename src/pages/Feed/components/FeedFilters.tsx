import { FilterChips } from '@/components/shared/FilterChips';
import type { FeedOrdering, PostType } from '@/types/feed';

/** `''` lists every post type. */
export type FeedTypeFilter = PostType | '';

const TYPE_OPTIONS: readonly { value: FeedTypeFilter; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'SHARED_EVIDENCE', label: 'Evidencias' },
  { value: 'COMMUNITY_MILESTONE', label: 'Hitos' },
  { value: 'OFFICIAL_ANNOUNCEMENT', label: 'Anuncios' },
];

const ORDERING_OPTIONS: readonly { value: FeedOrdering; label: string }[] = [
  { value: 'recent', label: 'Recientes' },
  { value: 'popular', label: 'Populares' },
];

interface FeedFiltersProps {
  type: FeedTypeFilter;
  ordering: FeedOrdering;
  onTypeChange: (type: FeedTypeFilter) => void;
  onOrderingChange: (ordering: FeedOrdering) => void;
}

/**
 * Post type and order controls of the feed. Each group is a row of `aria-pressed` buttons.
 */
export function FeedFilters({ type, ordering, onTypeChange, onOrderingChange }: FeedFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <FilterChips
        label="Filtrar por tipo de publicación"
        options={TYPE_OPTIONS}
        value={type}
        onChange={onTypeChange}
      />
      <FilterChips
        label="Ordenar publicaciones"
        options={ORDERING_OPTIONS}
        value={ordering}
        onChange={onOrderingChange}
      />
    </div>
  );
}
