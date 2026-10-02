import { Sparkles, Coins, Flame, Trophy } from 'lucide-react';
import type { EcologicalProfile } from '@/types/ecological-profile';

interface ProgressSectionProps {
  profile: EcologicalProfile;
}

export function ProgressSection({ profile }: ProgressSectionProps) {
  const levelText = profile.level !== null ? `Nivel ${profile.level}` : 'Sin nivel';

  return (
    <section aria-labelledby="progreso-title" className="space-y-4">
      <h2 id="progreso-title" className="text-xl font-bold text-secondary-500">
        Progreso y Nivel
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-secondary-100 flex flex-col items-center text-center">
          <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl mb-3">
            <Sparkles className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-secondary-500">
            {profile.totalPoints.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-secondary-300 mt-1 uppercase tracking-wider">
            Puntos Totales
          </p>
        </div>

        {/* Available Points */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-secondary-100 flex flex-col items-center text-center">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl mb-3">
            <Coins className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-secondary-500">
            {profile.availablePoints.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-secondary-300 mt-1 uppercase tracking-wider">
            Disponibles
          </p>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-secondary-100 flex flex-col items-center text-center">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl mb-3">
            <Flame className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-secondary-500">
            {profile.currentStreak}
          </p>
          <p className="text-xs font-semibold text-secondary-300 mt-1 uppercase tracking-wider">
            {profile.currentStreak === 1 ? 'Día de Racha' : 'Días de Racha'}
          </p>
        </div>

        {/* Level */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-secondary-100 flex flex-col items-center text-center">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl mb-3">
            <Trophy className="size-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-secondary-500">
            {profile.level !== null ? profile.level : '—'}
          </p>
          <p className="text-xs font-semibold text-secondary-300 mt-1 uppercase tracking-wider">
            {levelText}
          </p>
        </div>
      </div>
    </section>
  );
}
