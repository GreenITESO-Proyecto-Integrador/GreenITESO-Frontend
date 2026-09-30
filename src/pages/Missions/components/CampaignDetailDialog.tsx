import { useCallback, useState } from 'react';
import { CalendarRange, Plus, Users } from 'lucide-react';
import { ModalContent } from '@/components/custom/ModalContent';
import { MissionItem } from '@/components/shared/MissionItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCampaignDetail } from '@/hooks/use-campaign-detail';
import { useClanName } from '@/hooks/use-clan-name';
import { joinCampaign } from '@/lib/api/campaigns';
import { toFriendlyMessage } from '@/lib/api/errors';
import { SCOPE_META, STATUS_META, formatDate } from '@/lib/campaign-meta';
import type { CampaignDetail } from '@/types/campaign';
import type { Mission } from '@/types/mission';
import { AddMissionForm } from './AddMissionForm';
import { SuccessBanner } from './SuccessBanner';

interface CampaignDetailDialogProps {
  /** Campaign to show; null keeps the dialog closed. */
  campaignId: string | null;
  onClose: () => void;
  /** Called after joining or adding a mission, so the caller can refresh its lists. */
  onChanged?: () => void;
  /** Optional per-mission action, forwarded to MissionItem (e.g. log an action). */
  onLogAction?: (mission: Mission) => void;
  /** Shown instead of the error state when the detail request fails (sample data). */
  fallback?: CampaignDetail | null;
}

function DetailBody({
  campaignId,
  onChanged,
  onLogAction,
  fallback,
}: Omit<CampaignDetailDialogProps, 'campaignId' | 'onClose'> & { campaignId: string }) {
  const { detail: loaded, status, errorMessage, reload, refresh } = useCampaignDetail(campaignId);
  const [addingMission, setAddingMission] = useState(false);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const detail = loaded ?? (status === 'error' ? (fallback ?? null) : null);
  const usingFallback = loaded === null && detail !== null;
  const clanName = useClanName(detail?.targetClanId ?? null);

  async function handleJoin() {
    setJoining(true);
    setActionError(null);
    try {
      await joinCampaign(campaignId);
      setNotice('¡Listo! Te uniste a la campaña. Ya puedes completar sus misiones.');
      await refresh();
      onChanged?.();
    } catch (error) {
      setActionError(toFriendlyMessage(error, 'No se pudo completar la inscripción.'));
    } finally {
      setJoining(false);
    }
  }

  async function handleMissionAdded() {
    setAddingMission(false);
    setNotice('Misión agregada a la campaña.');
    await refresh();
    onChanged?.();
  }

  if (!detail) {
    if (status === 'error') {
      return (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <DialogTitle className="text-lg font-semibold">No se pudo cargar la campaña</DialogTitle>
          {errorMessage ? <p className="mt-2 text-sm">{errorMessage}</p> : null}
          <Button
            type="button"
            onClick={() => void reload()}
            className="mt-4 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
          >
            Reintentar
          </Button>
        </section>
      );
    }
    return (
      <>
        <DialogTitle className="sr-only">Detalle de campaña</DialogTitle>
        <p className="text-sm text-muted-foreground" role="status">
          Cargando campaña…
        </p>
      </>
    );
  }

  const { label: scopeLabel, icon: ScopeIcon } = SCOPE_META[detail.scope];
  const statusMeta = STATUS_META[detail.status];
  const isPromotion = detail.status === 'PROMOTION';
  const canAddMission = detail.canManage && isPromotion && !usingFallback;
  const canJoin = isPromotion && !detail.isParticipant && !usingFallback;
  const existingCodes = new Set(detail.missions.map(mission => mission.action.id));

  return (
    <>
      <DialogHeader className="pr-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
            <ScopeIcon className="size-3.5" />
            {scopeLabel}
          </Badge>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>
        <DialogTitle className="text-xl font-bold text-foreground">{detail.title}</DialogTitle>
        <DialogDescription className="text-sm sm:text-base">{detail.description}</DialogDescription>
      </DialogHeader>

      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <CalendarRange className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Fechas</dt>
            <dd className="font-medium text-foreground">
              {formatDate(detail.startDate)} – {formatDate(detail.endDate)}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Participantes</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {detail.participants.length}
            </dd>
          </div>
        </div>
        {detail.targetClanId ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Clan</dt>
            <dd className="font-medium text-foreground">{clanName ?? 'Clan'}</dd>
          </div>
        ) : null}
      </dl>

      {usingFallback ? (
        <p className="text-xs text-muted-foreground" role="status">
          Mostrando datos de ejemplo.{' '}
          <button
            type="button"
            className="min-h-11 cursor-pointer font-semibold underline"
            onClick={() => void reload()}
          >
            Reintentar
          </button>
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-foreground">Misiones</h3>
        {detail.missions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta campaña aún no tiene misiones.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {detail.missions.map(mission => (
              <MissionItem
                key={mission.id}
                mission={mission}
                userProgress={detail.progress[mission.id]}
                onLogAction={detail.status === 'IN_PROGRESS' ? onLogAction : undefined}
              />
            ))}
          </div>
        )}

        {canAddMission && addingMission ? (
          <AddMissionForm
            campaignId={detail.id}
            existingActionCodes={existingCodes}
            onAdded={handleMissionAdded}
            onCancel={() => setAddingMission(false)}
          />
        ) : null}
      </section>

      {actionError ? (
        <p className="text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {canJoin || (canAddMission && !addingMission) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {canAddMission && !addingMission ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddingMission(true)}
              className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
            >
              <Plus className="size-4" />
              Agregar misión
            </Button>
          ) : null}
          {canJoin ? (
            <Button
              type="button"
              disabled={joining}
              onClick={() => void handleJoin()}
              className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600 disabled:opacity-50"
            >
              {joining ? 'Uniéndome…' : 'Unirme'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/**
 * Reusable modal with a campaign's scope, status, dates, clan, participants and missions
 * (with the user's progress). Offers "Unirme" and "Agregar misión" when allowed.
 */
export function CampaignDetailDialog({
  campaignId,
  onClose,
  ...bodyProps
}: CampaignDetailDialogProps) {
  return (
    <Dialog open={campaignId !== null} onOpenChange={open => (open ? undefined : onClose())}>
      <ModalContent>
        {campaignId !== null ? <DetailBody campaignId={campaignId} {...bodyProps} /> : null}
      </ModalContent>
    </Dialog>
  );
}
