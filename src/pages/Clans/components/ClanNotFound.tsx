import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClanAction } from '@/hooks/use-clan-action';
import { joinClan } from '@/lib/api/clans';

interface ClanNotFoundProps {
  clanId: string | undefined;
}

/**
 * Shown when the clan page answers 404. Invite-only clans also look like this to people who
 * are not members, so this is where an invite link lets the user file a join request.
 */
export function ClanNotFound({ clanId }: ClanNotFoundProps) {
  const navigate = useNavigate();
  const { busy, error, run } = useClanAction();
  const [requested, setRequested] = useState(false);

  async function handleRequest() {
    if (!clanId) return;
    const ok = await run(() => joinClan(clanId), 'No se pudo enviar la solicitud.');
    if (ok) setRequested(true);
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center dark:border-sky-800 dark:bg-sky-900/30">
      <SearchX className="mx-auto mb-4 size-10 text-sky-700 dark:text-sky-300" />
      <h2 className="text-lg font-semibold text-sky-800 dark:text-sky-200">
        {requested ? 'Solicitud enviada' : 'No encontramos este clan'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-sky-700 dark:text-sky-300">
        {requested
          ? 'El líder del clan revisará tu solicitud. Cuando la acepte, el clan aparecerá en tu lista.'
          : 'Pudo haberse disuelto, o es un clan solo por invitación. Si recibiste una invitación, puedes solicitar unirte.'}
      </p>

      {error ? (
        <p
          role="alert"
          className="mx-auto mt-4 max-w-md rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {!requested && clanId ? (
          <Button
            type="button"
            onClick={() => void handleRequest()}
            disabled={busy}
            className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
          >
            {busy ? 'Enviando…' : 'Solicitar unirme'}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/clans')}
          className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
        >
          Ver todos los clanes
        </Button>
      </div>
    </section>
  );
}
