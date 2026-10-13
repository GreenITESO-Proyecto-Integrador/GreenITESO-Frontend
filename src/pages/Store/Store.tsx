import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/use-store';
import { AlertTriangle, RefreshCw, ShoppingBag } from 'lucide-react';
import { CategoryFilterTabs } from './components/CategoryFilterTabs';
import { ConfirmPurchaseModal } from './components/ConfirmPurchaseModal';
import { ExchangeableCard } from './components/ExchangeableCard';
import { StoreHeader } from './components/StoreHeader';
import { ToastNotification } from './components/ToastNotification';

export function StorePage() {
  const {
    items,
    allItemsCount,
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
    reload,
    handleBuyClick,
    handleConfirmRedeem,
  } = useStore();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-8 pb-24">
        {/* Header with Points Balance */}
        <StoreHeader availablePoints={availablePoints} />

        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex flex-col gap-6" role="status">
            <div className="h-11 w-72 animate-pulse rounded-full bg-card border border-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div
                  key={n}
                  className="h-80 w-full animate-pulse rounded-2xl bg-card border border-border p-4 flex flex-col gap-4"
                >
                  <div className="h-40 w-full rounded-xl bg-muted" />
                  <div className="h-5 w-3/4 rounded-lg bg-muted" />
                  <div className="h-4 w-1/2 rounded-lg bg-muted" />
                  <div className="mt-auto h-11 w-full rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-6 shrink-0" />
              <h2 className="text-lg font-bold">No se pudieron cargar los canjeables</h2>
            </div>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Ocurrió un error al consultar el catálogo de canjeables.
            </p>
            {errorMessage && (
              <p className="mt-2 text-xs font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                {errorMessage}
              </p>
            )}
            <Button
              type="button"
              onClick={() => void reload()}
              className="mt-4 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600 cursor-pointer"
            >
              <RefreshCw className="size-4 mr-2" />
              Reintentar
            </Button>
          </section>
        )}

        {/* Success State but Empty Catalog */}
        {status === 'success' && allItemsCount === 0 && (
          <section className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
            <ShoppingBag className="mb-3 size-10 text-secondary-300 dark:text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">No hay canjeables disponibles</h2>
            <p className="mt-1 text-sm text-secondary-300 dark:text-muted-foreground max-w-sm">
              Actualmente no existen artículos activos en la tienda.
            </p>
          </section>
        )}

        {/* Store Catalog View */}
        {status === 'success' && allItemsCount > 0 && (
          <div className="flex flex-col gap-6">
            <CategoryFilterTabs
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {items.length === 0 ? (
              <section className="flex min-h-36 items-center justify-center rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm font-semibold text-secondary-300 dark:text-muted-foreground">
                  Ningún artículo coincide con la categoría seleccionada.
                </p>
              </section>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                  <ExchangeableCard
                    key={item.id}
                    item={item}
                    isUnlocked={unlockedCosmetics.includes(item.key)}
                    onBuyClick={handleBuyClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmPurchaseModal
        item={itemToConfirm}
        userAvailablePoints={availablePoints}
        isSubmitting={isSubmitting}
        onClose={() => setItemToConfirm(null)}
        onConfirm={() => void handleConfirmRedeem()}
      />

      {/* Temporary Toast Banner */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </main>
  );
}

export default StorePage;
