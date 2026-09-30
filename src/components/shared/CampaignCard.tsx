import { CalendarRange, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import {
  PROGRESS_DARK_COLORS,
  SCOPE_META,
  STATUS_META,
  formatDateRange,
} from '@/lib/campaign-meta';
import { cn } from '@/lib/utils';
import type { Campaign } from '@/types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect?: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  const { label: scopeLabel, icon: ScopeIcon } = SCOPE_META[campaign.scope];
  const statusMeta = STATUS_META[campaign.status];
  const progressValue =
    campaign.missionsTotal > 0
      ? Math.round((campaign.missionsCompleted / campaign.missionsTotal) * 100)
      : null;

  return (
    <Card
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(campaign) : undefined}
      onKeyDown={
        onSelect
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(campaign);
              }
            }
          : undefined
      }
      className="gap-4 rounded-2xl bg-card py-0 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardHeader className="gap-3 p-4 pb-0">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <ScopeIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {scopeLabel}
              </p>
              <CardTitle className="truncate text-lg font-semibold text-foreground">
                {campaign.title}
              </CardTitle>
            </div>
          </div>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">
          {campaign.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarRange className="size-4" />
          {formatDateRange(campaign.startDate, campaign.endDate)}
        </div>

        {progressValue !== null ? (
          <Progress value={progressValue} className={cn('gap-1.5', PROGRESS_DARK_COLORS)}>
            <div className="flex w-full items-center justify-between text-xs font-medium text-foreground">
              <span>Progreso de misiones</span>
              <span className="tabular-nums text-muted-foreground">
                {campaign.missionsCompleted}/{campaign.missionsTotal}
              </span>
            </div>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-4" />
            Sin misiones asociadas todavía
          </div>
        )}
      </CardContent>
    </Card>
  );
}
