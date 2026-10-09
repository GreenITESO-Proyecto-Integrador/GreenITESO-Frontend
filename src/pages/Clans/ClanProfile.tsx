import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SuccessBanner } from '@/components/campaigns/SuccessBanner';
import { WRAP_TEXT } from '@/components/campaigns/field-limits';
import { useClanDetail } from '@/hooks/use-clan-detail';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEcologicalProfile } from '@/hooks/use-ecological-profile';
import { useRouteNotice } from '@/hooks/use-route-notice';
import {
  PRIVACY_META,
  clanTypeLabel,
  formatMemberSince,
  formatPoints,
  getInitials,
  type ClanNoticeState,
} from '@/lib/clan-meta';
import type { ClanDetail } from '@/types/clan';
import { ClanActions } from './components/ClanActions';
import { ClanMembersList } from './components/ClanMembersList';
import { ClanNotFound } from './components/ClanNotFound';

function ClanHeader({ clan }: { clan: ClanDetail }) {
  const privacy = PRIVACY_META[clan.privacy];
  const PrivacyIcon = privacy.icon;
  const created = formatMemberSince(clan.createdAt);

  return (
    <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          aria-hidden="true"
          className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 text-2xl font-extrabold text-white shadow-md sm:size-24 sm:text-3xl"
        >
          {getInitials(clan.name)}
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge
              variant="outline"
              className="border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300"
            >
              <Users />
              {clanTypeLabel(clan.type)}
            </Badge>
            {clan.type === 'PRIVATE' ? (
              <Badge variant="outline" className={privacy.className}>
                <PrivacyIcon />
                {privacy.label}
              </Badge>
            ) : null}
          </div>

          <h1 className={`text-2xl font-extrabold text-foreground sm:text-3xl ${WRAP_TEXT}`}>
            {clan.name}
          </h1>

          {clan.description ? (
            <p className={`max-w-xl text-sm text-foreground/85 ${WRAP_TEXT}`}>{clan.description}</p>
          ) : null}

          <dl className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm sm:justify-start">
            <div className="flex items-center gap-1.5">
              <Star aria-hidden="true" className="size-4 text-primary-500" />
              <dt className="sr-only">Puntos</dt>
              <dd className="font-semibold text-foreground">
                {formatPoints(clan.totalPoints)} puntos
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4 text-primary-500" />
              <dt className="sr-only">Miembros</dt>
              <dd className="font-semibold text-foreground">
                {clan.memberCount} {clan.memberCount === 1 ? 'miembro' : 'miembros'}
              </dd>
            </div>
            {created ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                <dt className="sr-only">Creado</dt>
                <dd>Desde {created}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </header>
  );
}

/**
 * A clan's public profile: score, members, and what the current user can do there.
 */
export function ClanProfilePage() {
  const { clanId } = useParams<{ clanId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { clan, status, errorMessage, refreshError, reload } = useClanDetail(clanId);
  const profileData = useEcologicalProfile();
  const { notice, setNotice, dismiss: dismissNotice } = useRouteNotice();

  const viewerId = user?.id ?? null;
  const isActiveClan = clan !== null && profileData.profile?.activePrivateClan?.id === clan.id;

  function goToClans(message: string) {
    const state: ClanNoticeState = { notice: message };
    navigate('/clans', { state });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-8 pb-24">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/clans')}
          className="min-h-11 cursor-pointer gap-2 font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a clanes
        </Button>
      </div>

      {notice ? <SuccessBanner message={notice} onDismiss={dismissNotice} /> : null}

      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Cargando clan…
        </p>
      ) : null}

      {status === 'error' ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">No se pudo cargar el clan</h2>
          <p className="mt-2 text-sm">Intenta de nuevo cuando el servicio esté disponible.</p>
          {errorMessage ? <p className="mt-2 text-xs text-red-600">{errorMessage}</p> : null}
          <Button
            type="button"
            onClick={() => void reload()}
            className="mt-4 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
          >
            Reintentar
          </Button>
        </section>
      ) : null}

      {status === 'not-found' ? <ClanNotFound clanId={clanId} /> : null}

      {status === 'success' && clan ? (
        <>
          {refreshError ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>No se pudo actualizar el clan. {refreshError}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void reload({ silent: true })}
                className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
              >
                Reintentar
              </Button>
            </div>
          ) : null}
          <ClanHeader clan={clan} />
          <ClanActions
            clan={clan}
            viewerId={viewerId}
            isActiveClan={isActiveClan}
            onChanged={message => {
              setNotice(message);
              void reload({ silent: true });
              void profileData.reload();
            }}
            onNotice={setNotice}
            onLeft={goToClans}
          />
          <ClanMembersList members={clan.members} viewerId={viewerId} />
        </>
      ) : null}
    </div>
  );
}

export default ClanProfilePage;
