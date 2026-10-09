import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WRAP_TEXT } from '@/components/campaigns/field-limits';
import { PRIVACY_META, clanTypeLabel, formatPoints } from '@/lib/clan-meta';
import type { ClanListItem } from '@/types/clan';

interface ClanCardProps {
  clan: ClanListItem;
}

/**
 * Clan summary card in the CampaignCard style. The whole card links to the clan profile.
 */
export function ClanCard({ clan }: ClanCardProps) {
  const privacy = PRIVACY_META[clan.privacy];
  const PrivacyIcon = privacy.icon;

  return (
    <Link
      to={`/clans/${clan.id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <Users className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {clanTypeLabel(clan.type)}
              </p>
              <h3 className={`truncate text-lg font-semibold text-foreground ${WRAP_TEXT}`}>
                {clan.name}
              </h3>
            </div>
          </div>
          {clan.type === 'PRIVATE' ? (
            <Badge variant="outline" className={privacy.className}>
              <PrivacyIcon />
              {privacy.label}
            </Badge>
          ) : null}
        </div>

        <p className={`line-clamp-2 min-h-10 text-sm text-muted-foreground ${WRAP_TEXT}`}>
          {clan.description || 'Este clan aún no tiene descripción.'}
        </p>

        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Star className="size-4 text-primary-500" />
          {formatPoints(clan.totalPoints)} puntos
        </p>
      </Card>
    </Link>
  );
}
