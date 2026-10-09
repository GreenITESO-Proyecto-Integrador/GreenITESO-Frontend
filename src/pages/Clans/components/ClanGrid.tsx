import { Pagination } from '@/components/shared/Pagination';
import { usePagedItems } from '@/hooks/use-paged-items';
import type { ClanListItem } from '@/types/clan';
import { ClanCard } from './ClanCard';

interface ClanGridProps {
  clans: ClanListItem[];
}

/**
 * Clan cards with client-side pagination. Give it a `key` that changes with the search to
 * reset the page.
 */
export function ClanGrid({ clans }: ClanGridProps) {
  const { page, totalPages, pageItems, setPage } = usePagedItems(clans);

  return (
    <div className="flex flex-col gap-5">
      <div
        key={page}
        className="grid animate-fade-in grid-cols-1 gap-4 motion-reduce:animate-none sm:grid-cols-2 lg:grid-cols-3"
      >
        {pageItems.map(clan => (
          <ClanCard key={clan.id} clan={clan} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label="clanes" />
    </div>
  );
}
