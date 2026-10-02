import { useState } from 'react';
import type { ExchangeableItem } from '@/types/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Coins, Loader2, ShoppingBag, Sparkles } from 'lucide-react';

interface ConfirmPurchaseModalProps {
  item: ExchangeableItem | null;
  userAvailablePoints: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmPurchaseModal({
  item,
  userAvailablePoints,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmPurchaseModalProps) {
  const [imgError, setImgError] = useState(false);

  if (!item) return null;

  const remainingPoints = userAvailablePoints - item.pointsCost;

  return (
    <Dialog open={Boolean(item)} onOpenChange={open => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card text-foreground border border-border shadow-xl">
        <DialogHeader className="gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
            <ShoppingBag className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Confirmar Canje de Artículo
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas canjear tus puntos por este artículo cosmético?
          </DialogDescription>
        </DialogHeader>

        {/* Item Preview Card */}
        <div className="my-2 flex items-center gap-4 rounded-xl border border-border bg-muted/50 p-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-primary-300 bg-background flex items-center justify-center">
            {item.imageUrl && !imgError ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <Sparkles className="size-8 text-primary-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-foreground truncate">{item.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary-100 dark:bg-primary-900/50 px-2 py-0.5 text-xs font-bold text-primary-700 dark:text-primary-300">
              <Coins className="size-3 text-amber-500" />
              {item.pointsCost} pts
            </span>
          </div>
        </div>

        {/* Points breakdown */}
        <div className="space-y-2 rounded-xl border border-border p-3 text-xs sm:text-sm bg-background">
          <div className="flex justify-between text-muted-foreground">
            <span>Tus puntos disponibles:</span>
            <span className="font-semibold tabular-nums text-foreground">
              {userAvailablePoints.toLocaleString()} pts
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Costo del canjeable:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              - {item.pointsCost.toLocaleString()} pts
            </span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between font-bold text-foreground">
            <span>Puntos restantes tras compra:</span>
            <span
              className={`tabular-nums ${
                remainingPoints >= 0
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-destructive'
              }`}
            >
              {remainingPoints.toLocaleString()} pts
            </span>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-11 flex-1 rounded-xl cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || remainingPoints < 0}
            className="min-h-11 flex-1 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Procesando…
              </>
            ) : (
              'Confirmar Canje'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
