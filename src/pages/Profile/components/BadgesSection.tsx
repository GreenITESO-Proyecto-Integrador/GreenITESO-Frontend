import { Award, Sparkles } from 'lucide-react';
import type { Badge } from '@/types/ecological-profile';

interface BadgesSectionProps {
  badges: Badge[];
}

export function BadgesSection({ badges }: BadgesSectionProps) {
  return (
    <section aria-labelledby="insignias-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <h2 id="insignias-title" className="text-xl font-bold text-secondary-500">
          Insignias y Reconocimientos
        </h2>
        <span className="text-xs text-secondary-300">
          Logros otorgados por tu constancia y compromiso ecológico
        </span>
      </div>

      {badges.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-secondary-100 shadow-sm">
          <div className="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Award className="size-6" />
          </div>
          <h3 className="text-base font-bold text-secondary-500">Aún no tienes insignias</h3>
          <p className="text-sm text-secondary-300 mt-1 max-w-md mx-auto">
            Participa en acciones sustentables, mantén tu racha y únete a campañas para desbloquear
            tus primeras insignias.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <div
              key={badge.id || `badge-${idx}`}
              className="bg-white rounded-2xl p-5 border border-secondary-100 shadow-sm flex flex-col items-center text-center hover:border-primary-200 transition-colors"
            >
              <div className="size-12 rounded-full bg-linear-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center mb-3 shadow-inner">
                <Sparkles className="size-6 text-primary-600" />
              </div>
              <h4 className="text-sm font-bold text-secondary-500 line-clamp-1">
                {badge.name || 'Insignia'}
              </h4>
              {badge.description ? (
                <p className="text-xs text-secondary-300 mt-1 line-clamp-2">{badge.description}</p>
              ) : null}
              {badge.unlockedAt ? (
                <span className="text-[10px] text-secondary-300 mt-2">
                  {new Date(badge.unlockedAt).toLocaleDateString()}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
