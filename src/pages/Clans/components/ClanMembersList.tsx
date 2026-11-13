import { useState } from 'react';
import { Crown, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WRAP_TEXT } from '@/components/campaigns/field-limits';
import { CosmeticAvatar } from '@/components/shared/CosmeticAvatar';
import { CosmeticBackground } from '@/components/shared/CosmeticBackground';
import { kickClanMember } from '@/lib/api/clans';
import { cosmeticHostClass } from '@/lib/safe-image-url';
import { formatMemberSince, memberDisplayName } from '@/lib/clan-meta';
import type { ClanMember } from '@/types/clan';
import { ConfirmClanActionDialog } from './ConfirmClanActionDialog';

interface ClanMembersListProps {
  members: ClanMember[];
  viewerId: string | null;
  clanId: string;
  /** The viewer leads this clan, so each other member gets an expel button. */
  isLeader: boolean;
  /** A member was expelled: the roster changed, so the page should refresh. */
  onKicked: (notice: string) => void;
}

const COLLAPSED_COUNT = 8;

/**
 * Accepted members, leader first. Long rosters start collapsed. The leader can expel the others.
 */
export function ClanMembersList({
  members,
  viewerId,
  clanId,
  isLeader,
  onKicked,
}: ClanMembersListProps) {
  const [expanded, setExpanded] = useState(false);
  // The member asked about stays set while the dialog closes, so its text does not flicker.
  const [target, setTarget] = useState<ClanMember | null>(null);
  const [kickOpen, setKickOpen] = useState(false);
  const targetName = target ? memberDisplayName(target) : '';
  const sorted = [...members].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'LEADER' ? -1 : 1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);

  return (
    <section aria-labelledby="clan-members-title" className="flex flex-col gap-4">
      <h2 id="clan-members-title" className="text-xl font-bold text-foreground">
        Miembros ({members.length})
      </h2>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este clan aún no tiene miembros.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map(member => {
            const name = memberDisplayName(member);
            const since = formatMemberSince(member.joinedAt);
            return (
              <li
                key={member.userId}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs ${cosmeticHostClass(member.backgroundUrl)}`}
              >
                <CosmeticBackground url={member.backgroundUrl} />
                <CosmeticAvatar
                  src={member.avatarUrl}
                  name={name}
                  frameUrl={member.frameUrl}
                  className="size-11 rounded-xl text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold text-foreground ${WRAP_TEXT}`}>
                    {name}
                    {member.userId === viewerId ? (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">(tú)</span>
                    ) : null}
                  </p>
                  {since ? <p className="text-xs text-muted-foreground">Desde {since}</p> : null}
                </div>
                {member.role === 'LEADER' ? (
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  >
                    <Crown />
                    Líder
                  </Badge>
                ) : null}
                {isLeader && member.role !== 'LEADER' && member.userId !== viewerId ? (
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Expulsar a ${name}`}
                    onClick={() => {
                      setTarget(member);
                      setKickOpen(true);
                    }}
                    className="min-h-11 cursor-pointer rounded-xl px-3 font-semibold text-red-700 hover:text-red-800"
                  >
                    <UserMinus className="size-4" />
                    <span className="hidden sm:inline">Expulsar</span>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {sorted.length > COLLAPSED_COUNT ? (
        <button
          type="button"
          onClick={() => setExpanded(current => !current)}
          className="min-h-11 cursor-pointer self-start rounded-xl px-2 text-sm font-semibold text-primary-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:text-primary-300"
        >
          {expanded ? 'Mostrar menos' : `Mostrar todos (${sorted.length})`}
        </button>
      ) : null}

      <ConfirmClanActionDialog
        open={kickOpen}
        onOpenChange={setKickOpen}
        title={`¿Expulsar a ${targetName}?`}
        description="Dejará de ser parte del clan y de sus campañas. Sus puntos ya aportados se conservan. Podrá volver a unirse si el clan lo permite."
        confirmLabel="Expulsar"
        pendingLabel="Expulsando…"
        destructive
        action={() => (target ? kickClanMember(clanId, target.userId) : Promise.resolve())}
        fallbackError="No se pudo expulsar a la persona."
        onDone={() => {
          setKickOpen(false);
          onKicked(`${targetName} ya no es parte del clan.`);
        }}
      />
    </section>
  );
}
