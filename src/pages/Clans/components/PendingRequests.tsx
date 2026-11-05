import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WRAP_TEXT } from '@/components/campaigns/field-limits';
import { useClanAction } from '@/hooks/use-clan-action';
import { useJoinRequests } from '@/hooks/use-join-requests';
import { acceptJoinRequest, rejectJoinRequest } from '@/lib/api/clans';
import { formatRequestDate, getInitials, memberDisplayName } from '@/lib/clan-meta';
import type { ClanJoinRequest, ClanPrivacy } from '@/types/clan';

interface PendingRequestsProps {
  clanId: string;
  privacy: ClanPrivacy;
  /** A request was accepted: the roster changed, so the page should refresh. */
  onAccepted: (notice: string) => void;
  /** A request was rejected: nothing else on the page changes. */
  onRejected: (notice: string) => void;
}

const FALLBACK_ERROR = {
  accept: 'No se pudo aceptar la solicitud.',
  reject: 'No se pudo rechazar la solicitud.',
} as const;

interface RequestRowProps {
  request: ClanJoinRequest;
  onAccept: (request: ClanJoinRequest) => Promise<void>;
  onReject: (request: ClanJoinRequest) => Promise<void>;
}

function RequestRow({ request, onAccept, onReject }: RequestRowProps) {
  const { busy, error, run } = useClanAction();
  const [pending, setPending] = useState<'accept' | 'reject' | null>(null);
  const name = memberDisplayName(request);
  const requested = formatRequestDate(request.joinedAt);

  async function handle(kind: 'accept' | 'reject') {
    setPending(kind);
    await run(
      () => (kind === 'accept' ? onAccept(request) : onReject(request)),
      FALLBACK_ERROR[kind],
    );
    setPending(null);
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
      <div className="flex min-h-14 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-700 text-sm font-extrabold text-white"
          >
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold text-foreground ${WRAP_TEXT}`}>{name}</p>
            {requested ? (
              <p className="text-xs text-muted-foreground">Solicitó el {requested}</p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            aria-label={`Rechazar solicitud de ${name}`}
            onClick={() => void handle('reject')}
            disabled={busy}
            className="min-h-11 flex-1 cursor-pointer rounded-xl px-4 font-semibold sm:flex-none"
          >
            <X className="size-4" />
            {pending === 'reject' ? 'Rechazando…' : 'Rechazar'}
          </Button>
          <Button
            type="button"
            aria-label={`Aceptar solicitud de ${name}`}
            onClick={() => void handle('accept')}
            disabled={busy}
            className="min-h-11 flex-1 cursor-pointer rounded-xl bg-primary-500 px-4 font-semibold text-white hover:bg-primary-600 sm:flex-none"
          >
            <Check className="size-4" />
            {pending === 'accept' ? 'Aceptando…' : 'Aceptar'}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Leader-only list of people asking to join the clan, with accept / reject for each.
 * An empty list is only worth showing for invite-only clans.
 */
export function PendingRequests({ clanId, privacy, onAccepted, onRejected }: PendingRequestsProps) {
  const { requests, status, errorMessage, reload, remove } = useJoinRequests(clanId);

  async function handleAccept(request: ClanJoinRequest) {
    await acceptJoinRequest(clanId, request.userId);
    remove(request.id);
    onAccepted(`${memberDisplayName(request)} ya es parte del clan.`);
  }

  async function handleReject(request: ClanJoinRequest) {
    await rejectJoinRequest(clanId, request.userId);
    remove(request.id);
    onRejected(`Rechazaste la solicitud de ${memberDisplayName(request)}.`);
  }

  if (status === 'success' && requests.length === 0 && privacy === 'PUBLIC') return null;

  return (
    <section aria-labelledby="clan-requests-title" className="flex flex-col gap-4">
      <h2 id="clan-requests-title" className="text-xl font-bold text-foreground">
        Solicitudes pendientes{status === 'success' ? ` (${requests.length})` : ''}
      </h2>

      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Cargando solicitudes…
        </p>
      ) : null}

      {status === 'error' ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>No se pudieron cargar las solicitudes. {errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void reload()}
            className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {status === 'success' && requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
      ) : null}

      {requests.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {requests.map(request => (
            <RequestRow
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
