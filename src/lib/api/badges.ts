import { apiFetch } from './client';
import type { Badge } from '@/types/badge';

export async function fetchBadgeCatalog(): Promise<Badge[]> {
  const response = await apiFetch('/api/v1/rankings/badges/');

  if (!response.ok) {
    throw new Error(`Error al obtener las insignias: HTTP ${response.status}`);
  }

  // apiFetch devuelve el objeto Response nativo, por lo que extraemos el JSON manualmente
  return (await response.json()) as Badge[];
}
