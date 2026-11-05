import { useState } from 'react';
import { Pencil, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NicknameChangeResult } from '@/lib/api/account';
import type { EcologicalProfile } from '@/types/ecological-profile';
import { ChangeNicknameDialog } from './ChangeNicknameDialog';
import { DeactivateAccountDialog } from './DeactivateAccountDialog';

interface AccountSectionProps {
  profile: EcologicalProfile;
  onProfileChange: (profile: EcologicalProfile) => void;
}

export function AccountSection({ profile, onProfileChange }: AccountSectionProps) {
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const costHint =
    profile.nicknameChangeCost === 0
      ? 'Tu primer cambio es gratis.'
      : `El siguiente cambio cuesta ${profile.nicknameChangeCost} puntos.`;

  function handleNicknameChanged(result: NicknameChangeResult) {
    // The change moves points out of the balance, so the profile shows both at once.
    onProfileChange({
      ...profile,
      nickname: result.nickname,
      nicknameChangeCost: result.nextChangeCost,
      availablePoints: result.availablePoints,
    });
  }

  return (
    <section aria-labelledby="cuenta-title" className="space-y-4">
      <h2 id="cuenta-title" className="text-xl font-bold text-foreground">
        Cuenta
      </h2>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Nickname
          </p>
          <p className="truncate text-lg font-bold text-foreground">
            {profile.nickname || 'Sin nickname'}
          </p>
          <p className="text-xs text-muted-foreground">{costHint}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsNicknameOpen(true)}
          className="h-11 cursor-pointer gap-2 self-start rounded-xl font-semibold sm:self-auto"
        >
          <Pencil className="size-4 text-primary-600 dark:text-primary-400" />
          Cambiar nickname
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Desactivar cuenta</p>
          <p className="text-xs text-muted-foreground">
            Borra tu progreso y cierra tu sesión. Si vuelves a entrar, empiezas desde cero.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setIsDeactivateOpen(true)}
          className="h-11 cursor-pointer gap-2 self-start rounded-xl font-semibold sm:self-auto"
        >
          <UserX className="size-4" />
          Desactivar cuenta
        </Button>
      </div>

      <ChangeNicknameDialog
        open={isNicknameOpen}
        onOpenChange={setIsNicknameOpen}
        currentNickname={profile.nickname}
        cost={profile.nicknameChangeCost}
        availablePoints={profile.availablePoints}
        onChanged={handleNicknameChanged}
      />

      <DeactivateAccountDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen} />
    </section>
  );
}
