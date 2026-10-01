import { CampaignCard } from '@/components/shared/CampaignCard';
import { usePagedItems } from '@/hooks/use-paged-items';
import type { Campaign } from '@/types/campaign';
import { Pagination } from '@/components/shared/Pagination';

interface CampaignGridProps {
  campaigns: Campaign[];
  onSelect: (campaign: Campaign) => void;
}

/**
 * Campaign cards with client-side pagination. Give it a `key` that changes with the filters
 * to reset the page.
 */
export function CampaignGrid({ campaigns, onSelect }: CampaignGridProps) {
  const { page, totalPages, pageItems, setPage } = usePagedItems(campaigns);

  return (
    <div className="flex flex-col gap-5">
      <div
        key={page}
        className="grid animate-fade-in grid-cols-1 gap-4 motion-reduce:animate-none sm:grid-cols-2 lg:grid-cols-3"
      >
        {pageItems.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} onSelect={onSelect} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label="campañas" />
    </div>
  );
}
