import { Coins } from 'lucide-react';

interface StoreHeaderProps {
  availablePoints: number;
}

export function StoreHeader({ availablePoints }: StoreHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tienda de canjeables</h1>
        <p className="mt-1 text-sm text-secondary-300 dark:text-muted-foreground sm:text-base">
          Canjea tus puntos acumulados por marcos de avatar, fondos de perfil y cosméticos.
        </p>
      </div>

      {/* Points section styled matching Dashboard Impact banner */}
      <section
        aria-label="Puntos disponibles para canje"
        className="flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-6 text-center dark:border-primary-700 dark:bg-primary-900/20 sm:flex-row sm:justify-between sm:px-8"
      >
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Saldo de puntos
          </p>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Puntos disponibles para canjear
          </h2>
          <p className="mt-0.5 text-xs text-secondary-300 dark:text-muted-foreground">
            Los puntos se descontarán de tu saldo disponible al confirmar un canje.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 sm:mt-0">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200">
            <Coins className="size-5" />
          </div>
          <span className="text-3xl font-extrabold text-primary-700 dark:text-primary-300 tabular-nums">
            {availablePoints.toLocaleString()} <span className="text-sm font-semibold">pts</span>
          </span>
        </div>
      </section>
    </div>
  );
}
