import { Globe, Lock } from 'lucide-react';
import type { EcologicalProfile } from '@/types/ecological-profile';

interface ProfileHeaderProps {
  profile: EcologicalProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const isPublic = profile.visibility === 'PUBLIC';
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
  const initials =
    (profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '') ||
    profile.email?.[0]?.toUpperCase() ||
    'U';

  const roleLabelMap: Record<string, string> = {
    STUDENT: 'Estudiante',
    STAFF: 'Personal ITESO',
    ADMIN: 'Administrador',
  };
  const roleLabel = roleLabelMap[profile.role] ?? profile.role;

  return (
    <header className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-secondary-100">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar / Initials */}
        <div
          aria-hidden="true"
          className="size-20 sm:size-24 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0"
        >
          {initials}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-secondary-500">{fullName}</h1>
            <span className="inline-flex items-center self-center px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              {roleLabel}
            </span>
          </div>

          <p className="text-sm text-secondary-300 font-medium">{profile.email}</p>

          {/* Visibility Indicator & Respect Configured Privacy */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <div
              className={`inline-flex items-center gap-1.5 self-center sm:self-start px-3 py-1 rounded-full font-semibold border ${
                isPublic
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-secondary-50 text-secondary-500 border-secondary-200'
              }`}
            >
              {isPublic ? (
                <>
                  <Globe className="size-3.5" />
                  <span>Perfil Público</span>
                </>
              ) : (
                <>
                  <Lock className="size-3.5" />
                  <span>Perfil Privado</span>
                </>
              )}
            </div>

            <p className="text-secondary-400">
              {isPublic
                ? 'Visible para la comunidad ITESO en tablas de clasificación.'
                : 'Configuración privada activa: tus métricas solo son visibles por ti.'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
