import { useCallback, useEffect, useState } from 'react';
import type { ExchangeableCategory, ExchangeableItem } from '@/types/store';
import { fetchEcologicalProfile } from '@/lib/api/ecological-profile';
import {
  fetchExchangeableItems,
  fetchMyInventory,
  redeemExchangeableItem,
} from '@/lib/api/exchangeables';

export interface ToastState {
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
}

export function useStore() {
  const [items, setItems] = useState<ExchangeableItem[]>([]);
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>([]);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExchangeableCategory | 'ALL'>('ALL');

  const [itemToConfirm, setItemToConfirm] = useState<ExchangeableItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((toastData: ToastState) => {
    setToast(toastData);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const loadStoreData = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const [fetchedItems, profile, inventory] = await Promise.all([
        fetchExchangeableItems(),
        fetchEcologicalProfile().catch(() => null),
        fetchMyInventory().catch(() => []),
      ]);

      setItems(fetchedItems);

      if (profile) {
        setAvailablePoints(profile.availablePoints);
      }

      // Combine cosmetics from profile and inventory endpoints
      const combinedCosmetics = new Set<string>([
        ...(profile?.badges ? [] : []),
        ...(inventory || []),
      ]);
      setUnlockedCosmetics(Array.from(combinedCosmetics));

      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al cargar la tienda';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadStoreData();
  }, [loadStoreData]);

  const handleBuyClick = (item: ExchangeableItem) => {
    // 1. Check if already unlocked
    if (unlockedCosmetics.includes(item.key)) {
      showToast({
        type: 'info',
        title: 'Artículo ya adquirido',
        description: `Ya posees el artículo "${item.name}" en tu colección.`,
      });
      return;
    }

    // 2. Check points balance
    if (availablePoints < item.pointsCost) {
      showToast({
        type: 'error',
        title: 'Puntos insuficientes',
        description: `Necesitas ${item.pointsCost} puntos para "${item.name}", pero solo tienes ${availablePoints} puntos disponibles.`,
      });
      return;
    }

    // 3. Open confirmation modal
    setItemToConfirm(item);
  };

  const handleConfirmRedeem = async () => {
    if (!itemToConfirm) return;

    setIsSubmitting(true);
    try {
      const response = await redeemExchangeableItem(itemToConfirm.id);

      // Update available points
      setAvailablePoints(response.availablePoints);

      // Update unlocked cosmetics list
      setUnlockedCosmetics(prev => {
        const set = new Set([...prev, response.unlockedKey, itemToConfirm.key]);
        if (response.unlockedCosmetics) {
          response.unlockedCosmetics.forEach(key => set.add(key));
        }
        return Array.from(set);
      });

      showToast({
        type: 'success',
        title: '¡Canje exitoso! 🎉',
        description: `Has adquirido "${itemToConfirm.name}" por ${itemToConfirm.pointsCost} puntos.`,
      });

      setItemToConfirm(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo completar el canje';
      showToast({
        type: 'error',
        title: 'Error en el canje',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(
    item => selectedCategory === 'ALL' || item.category === selectedCategory,
  );

  return {
    items: filteredItems,
    allItemsCount: items.length,
    unlockedCosmetics,
    availablePoints,
    status,
    errorMessage,
    selectedCategory,
    setSelectedCategory,
    itemToConfirm,
    setItemToConfirm,
    isSubmitting,
    toast,
    dismissToast,
    reload: loadStoreData,
    handleBuyClick,
    handleConfirmRedeem,
  };
}
