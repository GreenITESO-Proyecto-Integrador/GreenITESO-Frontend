import { useSyncExternalStore } from 'react';

const LARGE_QUERY = '(min-width: 1024px)';
const MEDIUM_QUERY = '(min-width: 640px)';

/** Cards per page: 6 on large screens (3 columns), 4 on medium (2 columns), 2 on small. */
const LARGE_PAGE_SIZE = 6;
const MEDIUM_PAGE_SIZE = 4;
const SMALL_PAGE_SIZE = 2;

function subscribe(onChange: () => void): () => void {
  const queries = [window.matchMedia(LARGE_QUERY), window.matchMedia(MEDIUM_QUERY)];
  queries.forEach(query => query.addEventListener('change', onChange));
  return () => queries.forEach(query => query.removeEventListener('change', onChange));
}

function getSnapshot(): number {
  if (window.matchMedia(LARGE_QUERY).matches) return LARGE_PAGE_SIZE;
  if (window.matchMedia(MEDIUM_QUERY).matches) return MEDIUM_PAGE_SIZE;
  return SMALL_PAGE_SIZE;
}

/**
 * How many campaign cards fit per page at the current screen width. Matches the Tailwind
 * `sm` (640px) and `lg` (1024px) breakpoints used by the card grid.
 */
export function useCampaignPageSize(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => LARGE_PAGE_SIZE);
}
