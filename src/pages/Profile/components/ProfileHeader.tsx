import { Globe, Lock, Pencil } from 'lucide-react';
import type { EcologicalProfile } from '@/types/ecological-profile';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  profile: EcologicalProfile;
  onEditProfile?: () => void;
}

export function ProfileHeader({ profile, onEditProfile }: ProfileHeaderProps) {
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
    <header className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar / Initials */}
        <div className="size-20 sm:size-24 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0 overflow-hidden">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={fullName}
              className="size-full object-cover"
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{fullName}</h1>
              <span className="inline-flex items-center self-center px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                {roleLabel}
              </span>
            </div>

            {onEditProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditProfile}
                className="inline-flex items-center gap-2 self-center sm:self-auto rounded-xl border-border bg-background hover:bg-muted text-foreground cursor-pointer shadow-xs font-semibold text-xs h-9"
              >
                <Pencil className="size-3.5 text-primary-600 dark:text-primary-400" />
                <span>Editar perfil</span>
              </Button>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground font-medium">{profile.email}</p>

          {profile.bio ? (
            <p className="text-sm text-foreground/85 max-w-xl">{profile.bio}</p>
          ) : null}

          {/* Visibility Indicator & Respect Configured Privacy */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <div
              className={`inline-flex items-center gap-1.5 self-center sm:self-start px-3 py-1 rounded-full font-semibold border ${
                isPublic
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-muted text-muted-foreground border-border'
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

            <p className="text-muted-foreground">
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
