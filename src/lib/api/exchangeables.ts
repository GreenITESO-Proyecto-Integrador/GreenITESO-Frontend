import type { ExchangeableCategory, ExchangeableItem, RedeemResponse } from '@/types/store';
import { apiFetch } from './client';

export const EXCHANGEABLES_PATH = '/api/v1/exchangeables/';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function readBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
}

export function mapExchangeableItem(payload: unknown): ExchangeableItem {
  if (!isRecord(payload)) {
    throw new Error('Formato de canjeable inválido');
  }

  const categoryRaw = readString(payload.category, 'FRAME').toUpperCase();
  const category: ExchangeableCategory =
    categoryRaw === 'FRAME'
      ? 'FRAME'
      : categoryRaw === 'BACKGROUND' || categoryRaw === 'THEME'
        ? 'BACKGROUND'
        : 'OTHER';

  return {
    id: readString(payload.id),
    key: readString(payload.key),
    name: readString(payload.name, 'Canjeable'),
    description: readString(payload.description),
    category,
    pointsCost: readNumber(payload.points_cost ?? payload.pointsCost),
    isActive: readBoolean(payload.is_active ?? payload.isActive),
    imageUrl: readString(payload.image_url ?? payload.imageUrl),
    createdAt: readString(payload.created_at ?? payload.createdAt),
    updatedAt: readString(payload.updated_at ?? payload.updatedAt),
  };
}

export async function fetchExchangeableItems(): Promise<ExchangeableItem[]> {
  const response = await apiFetch(EXCHANGEABLES_PATH);

  if (!response.ok) {
    throw new Error(`Error al obtener los canjeables (${response.status})`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('La respuesta de canjeables no es un JSON válido');
  }

  let rawList: unknown[] = [];
  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (isRecord(payload) && Array.isArray(payload.results)) {
    rawList = payload.results;
  }

  return rawList.map(mapExchangeableItem).filter(item => item.isActive);
}

export async function fetchMyInventory(): Promise<string[]> {
  const response = await apiFetch(`${EXCHANGEABLES_PATH}my-inventory/`);

  if (!response.ok) {
    throw new Error(`Error al consultar inventario (${response.status})`);
  }

  const payload = await response.json();
  if (isRecord(payload) && Array.isArray(payload.unlocked_cosmetics)) {
    return payload.unlocked_cosmetics.map(k => String(k));
  }
  return [];
}

export async function redeemExchangeableItem(itemId: string): Promise<RedeemResponse> {
  const response = await apiFetch(`${EXCHANGEABLES_PATH}${itemId}/redeem/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data
        ? String(data.error)
        : 'No se pudo completar el canje';
    throw new Error(message);
  }

  return {
    message: readString(data.message, 'Canjeable obtenido exitosamente.'),
    unlockedKey: readString(data.unlocked_key),
    availablePoints: readNumber(data.available_points),
    unlockedCosmetics: Array.isArray(data.unlocked_cosmetics)
      ? data.unlocked_cosmetics.map((k: unknown) => String(k))
      : [],
  };
}
