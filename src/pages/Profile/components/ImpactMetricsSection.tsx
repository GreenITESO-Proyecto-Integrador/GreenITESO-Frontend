import { Leaf, Droplets, Recycle } from 'lucide-react';
import type { ImpactMetrics } from '@/types/ecological-profile';

interface ImpactMetricsSectionProps {
  metrics: ImpactMetrics;
}

export function ImpactMetricsSection({ metrics }: ImpactMetricsSectionProps) {
  const formatMetric = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section aria-labelledby="impacto-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <h2 id="impacto-title" className="text-xl font-bold text-foreground">
          Impacto Ambiental Acumulado
        </h2>
        <span className="text-xs text-muted-foreground">
          Calculado a partir de tus acciones ecológicas aprobadas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CO2 Evitado */}
        <div className="bg-primary-50 dark:bg-primary-950/40 border-2 border-primary-200 dark:border-primary-800 rounded-2xl p-6 text-center shadow-xs transition-transform hover:scale-[1.01]">
          <Leaf className="size-8 text-primary-700 dark:text-primary-400 mx-auto mb-3" />
          <p className="font-bold text-primary-700 dark:text-primary-300 text-sm sm:text-base">
            CO₂ Evitado
          </p>
          <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-100 mt-1">
            {formatMetric(metrics.co2Kg)} kg
          </p>
        </div>

        {/* Agua Ahorrada */}
        <div className="bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-200 dark:border-sky-800 rounded-2xl p-6 text-center shadow-xs transition-transform hover:scale-[1.01]">
          <Droplets className="size-8 text-sky-700 dark:text-sky-400 mx-auto mb-3" />
          <p className="font-bold text-sky-700 dark:text-sky-300 text-sm sm:text-base">
            Agua Ahorrada
          </p>
          <p className="text-2xl font-extrabold text-sky-800 dark:text-sky-100 mt-1">
            {formatMetric(metrics.waterLiters)} L
          </p>
        </div>

        {/* Plástico Reciclado */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center shadow-xs transition-transform hover:scale-[1.01]">
          <Recycle className="size-8 text-emerald-700 dark:text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
            Plástico Reciclado
          </p>
          <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-100 mt-1">
            {formatMetric(metrics.plasticKg)} kg
          </p>
        </div>
      </div>
    </section>
  );
}
