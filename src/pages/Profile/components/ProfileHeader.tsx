import { useEffect, useState } from 'react';
import { Globe, Lock, Pencil } from 'lucide-react';
import type { EcologicalProfile } from '@/types/ecological-profile';
import type { ExchangeableItem } from '@/types/store';
import { fetchExchangeableItems } from '@/lib/api/exchangeables';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  profile: EcologicalProfile;
  onEditProfile?: () => void;
}

export function ProfileHeader({ profile, onEditProfile }: ProfileHeaderProps) {
  const isPublic = profile.visibility === 'PUBLIC';
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email;

  const roleLabelMap: Record<string, string> = {
    STUDENT: 'Estudiante',
    STAFF: 'Personal ITESO',
    ADMIN: 'Administrador',
  };
  const roleLabel = roleLabelMap[profile.role] ?? profile.role;

  const [exchangeables, setExchangeables] = useState<ExchangeableItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchExchangeableItems()
      .then(items => {
        if (isMounted) setExchangeables(items);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const activeFrameKey = (profile.preferences?.active_frame as string) || undefined;
  const activeBackgroundKey = (profile.preferences?.active_background as string) || undefined;

  const frameUrl =
    (profile.preferences?.active_frame_url as string | undefined) ||
    (activeFrameKey ? exchangeables.find(i => i.key === activeFrameKey)?.imageUrl : undefined);

  const backgroundUrl =
    (profile.preferences?.active_background_url as string | undefined) ||
    (activeBackgroundKey
      ? exchangeables.find(i => i.key === activeBackgroundKey)?.imageUrl
      : undefined);

  return (
    <header className="relative bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border overflow-hidden">
      {backgroundUrl ? (
        <>
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover select-none pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-card/85 dark:bg-card/90 backdrop-blur-[2px] transition-colors pointer-events-none"
          />
        </>
      ) : null}

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar / Initials with cosmetic frame */}
        <div className="relative size-20 sm:size-24 shrink-0 flex items-center justify-center">
          <UserAvatar
            src={profile.avatarUrl}
            name={fullName}
            className="size-full rounded-2xl text-2xl sm:text-3xl shadow-md"
          />
          {frameUrl ? (
            <img
              src={frameUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full scale-[1.14] object-contain pointer-events-none z-10 select-none"
            />
          ) : null}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{fullName}</h1>
              <span className="inline-flex items-center self-center rounded-full border border-primary-200 bg-primary-50 px-3 py-0.5 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-900/60 dark:text-primary-300">
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
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-700/40 dark:text-emerald-300'
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
