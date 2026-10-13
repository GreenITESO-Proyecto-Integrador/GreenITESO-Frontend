import { Link } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';
import { useEcologicalProfile } from '@/hooks/use-ecological-profile';
import type { ClanSummary } from '@/types/ecological-profile';

function MyClanLink({
  clan,
  label,
  icon: Icon,
}: {
  clan: ClanSummary;
  label: string;
  icon: typeof Users;
}) {
  return (
    <Link
      to={`/clans/${clan.id}`}
      className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate text-base font-semibold text-foreground [overflow-wrap:anywhere]">
          {clan.name}
        </p>
      </div>
    </Link>
  );
}

/**
 * Shortcuts to the user's institutional clan and active private clan, taken from the profile.
 * Hidden while loading, on error, or when the user has neither: it is only a convenience.
 */
export function MyClansSection() {
  const { profile, status } = useEcologicalProfile();
  if (status !== 'success' || !profile) return null;
  const { institutionalClan, activePrivateClan } = profile;
  if (!institutionalClan && !activePrivateClan) return null;

  return (
    <section aria-labelledby="my-clans-title" className="flex flex-col gap-4">
      <h2 id="my-clans-title" className="text-xl font-bold text-foreground">
        Mis clanes
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {institutionalClan ? (
          <MyClanLink clan={institutionalClan} label="Institucional" icon={GraduationCap} />
        ) : null}
        {activePrivateClan ? (
          <MyClanLink clan={activePrivateClan} label="Clan activo" icon={Users} />
        ) : null}
      </div>
    </section>
  );
}
