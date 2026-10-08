import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WRAP_TEXT } from '@/components/campaigns/field-limits';
import { formatMemberSince, getInitials, memberDisplayName } from '@/lib/clan-meta';
import type { ClanMember } from '@/types/clan';

interface ClanMembersListProps {
  members: ClanMember[];
  viewerId: string | null;
}

const COLLAPSED_COUNT = 8;

/**
 * Accepted members, leader first. Long rosters start collapsed.
 */
export function ClanMembersList({ members, viewerId }: ClanMembersListProps) {
  const [expanded, setExpanded] = useState(false);
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
            const name = memberDisplayName(member.nickname);
            const since = formatMemberSince(member.joinedAt);
            return (
              <li
                key={member.userId}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs"
              >
                <div
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-700 text-sm font-extrabold text-white"
                >
                  {getInitials(name)}
                </div>
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
    </section>
  );
}
