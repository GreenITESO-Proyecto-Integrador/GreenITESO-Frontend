import { useEffect, useState } from 'react';
import { fetchBadgeCatalog } from '@/lib/api/badges';
import { BadgeCard } from './BadgeCard';
import type { Badge } from '@/types/badge';

export function BadgeGallery() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBadges() {
      try {
        const data = await fetchBadgeCatalog();
        setBadges(data);
      } catch (err) {
        setError('Error al cargar las insignias. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadBadges();
  }, []);

  // Skeleton loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-40 bg-secondary-100 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  // Error boundary
  if (error) {
    return <div className="text-sm text-red-600 text-center p-4">{error}</div>;
  }

  // Empty state
  if (badges.length === 0) {
    return (
      <div className="text-sm text-secondary-400 text-center p-8 bg-secondary-50 rounded-2xl">
        Aún no hay insignias disponibles.
      </div>
    );
  }

  // Main grid render
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map(badge => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
