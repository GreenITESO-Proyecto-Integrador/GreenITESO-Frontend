import { Droplets, Flame, Leaf, Recycle, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EcologicalProfile } from '@/types/ecological-profile';

interface ImpactMetricsProps {
  profile: EcologicalProfile;
}

const numberFormatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

function formatAmount(value: number, unit: string): string {
  return `${numberFormatter.format(value)} ${unit}`;
}

interface ImpactTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  className: string;
}

function ImpactTile({ icon: Icon, label, value, className }: ImpactTileProps) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-5" />
        {label}
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Environmental impact + gamification totals, already aggregated server-side
 * (GET /api/v1/profile/me/ — accounts.selectors.get_ecological_profile).
 */
export function ImpactMetrics({ profile }: ImpactMetricsProps) {
  const { impactMetrics, totalPoints, currentStreak } = profile;

  return (
    <section aria-label="Dashboard Impact" className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-foreground">Tu impacto</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ImpactTile
          icon={Leaf}
          label="CO₂ evitado"
          value={formatAmount(impactMetrics.co2Kg, 'kg')}
          className="border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
        />
        <ImpactTile
          icon={Droplets}
          label="Agua ahorrada"
          value={formatAmount(impactMetrics.waterLiters, 'L')}
          className="border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
        />
        <ImpactTile
          icon={Recycle}
          label="Plástico evitado"
          value={formatAmount(impactMetrics.plasticKg, 'kg')}
          className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ImpactTile
          icon={Trophy}
          label="Puntos totales"
          value={numberFormatter.format(totalPoints)}
          className="border-border bg-card text-foreground"
        />
        <ImpactTile
          icon={Flame}
          label="Racha actual"
          value={`${numberFormatter.format(currentStreak)} días`}
          className="border-border bg-card text-foreground"
        />
      </div>
    </section>
  );
}
