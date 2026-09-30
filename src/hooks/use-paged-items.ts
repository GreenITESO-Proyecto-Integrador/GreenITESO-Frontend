import { useState } from 'react';
import { useCampaignPageSize } from './use-campaign-page-size';

/**
 * Client-side pagination. Page size follows the screen width (6 large, 4 medium, 2 small).
 * The page is clamped, so it stays valid when the list shrinks or the screen is resized.
 */
export function usePagedItems<T>(items: T[]) {
  const pageSize = useCampaignPageSize();
  const [requestedPage, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return { page, totalPages, pageItems, setPage };
}
