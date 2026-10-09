export type ExchangeableCategory = 'FRAME' | 'BACKGROUND' | 'THEME' | 'OTHER';

export interface ExchangeableItem {
  id: string;
  key: string;
  name: string;
  description: string;
  category: ExchangeableCategory;
  pointsCost: number;
  isActive: boolean;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RedeemResponse {
  message: string;
  unlockedKey: string;
  availablePoints: number;
  unlockedCosmetics: string[];
}

export interface InventoryResponse {
  unlockedCosmetics: string[];
}
