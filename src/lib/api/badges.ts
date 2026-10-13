import type { Badge } from '@/types/ecological-profile';

// Extend the base Badge to include properties specific to the catalog view
export interface CatalogBadge extends Badge {
  isEarned: boolean;
  pointsRequired: number;
}

// Define the raw response shape from the backend to avoid using 'any'
interface RawBadgeResponse {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  earned_at: string | null;
  is_earned: boolean;
  points_required: number;
}

/**
 * Fetches the badge catalog from the backend.
 * Handles DRF paginated responses and maps snake_case properties to camelCase.
 */
export async function fetchBadgeCatalog(): Promise<CatalogBadge[]> {
  const token = sessionStorage.getItem('greeniteso.access_token');

  const response = await fetch('/api/v1/rankings/badges/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch badges');
  }

  const data = await response.json();

  // Handle DRF pagination envelope ({ results: [...] }) if present
  const rawBadges = data.results ? data.results : data;

  // Map snake_case to camelCase at the boundary, strictly matching the existing Badge type
  return rawBadges.map((raw: RawBadgeResponse) => ({
    id: raw.id,
    name: raw.name,
    description: raw.description,
    icon: raw.icon_name, // Maps to the existing 'icon' property
    unlockedAt: raw.earned_at, // Maps to the existing 'unlockedAt' property
    isEarned: raw.is_earned,
    pointsRequired: raw.points_required,
  }));
}
