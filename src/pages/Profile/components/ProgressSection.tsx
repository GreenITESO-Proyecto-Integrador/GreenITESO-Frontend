import { Sparkles, Coins, Flame, Trophy } from 'lucide-react';
import type { EcologicalProfile } from '@/types/ecological-profile';

interface ProgressSectionProps {
  profile: EcologicalProfile;
}

export function ProgressSection({ profile }: ProgressSectionProps) {
  const levelText = profile.level !== null ? `Nivel ${profile.level}` : 'Sin nivel';

  return (
    <section aria-labelledby="progreso-title" className="space-y-4">
      <h2 id="progreso-title" className="text-xl font-bold text-foreground">
        Progreso y Nivel
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300">
            <Sparkles className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {profile.totalPoints.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
            Puntos Totales
          </p>
        </div>

        {/* Available Points */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-sky-50 p-2.5 text-sky-600 dark:bg-sky-800/50 dark:text-sky-300">
            <Coins className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {profile.availablePoints.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
            Disponibles
          </p>
        </div>

        {/* Streak */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300">
            <Flame className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {profile.currentStreak}
          </p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
            {profile.currentStreak === 1 ? 'Día de Racha' : 'Días de Racha'}
          </p>
        </div>

        {/* Level */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-700/50 dark:text-emerald-300">
            <Trophy className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {profile.level !== null ? profile.level : '—'}
          </p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
            {levelText}
          </p>
        </div>
      </div>
    </section>
  );
}
