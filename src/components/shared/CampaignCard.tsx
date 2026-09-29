import { CalendarRange, Megaphone, Sparkles, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import type { Campaign, CampaignStatus, CampaignType } from '@/types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect?: (campaign: Campaign) => void;
}

const TYPE_META: Record<CampaignType, { label: string; icon: typeof Target }> = {
  RETO: { label: 'Reto', icon: Target },
  EVENTO: { label: 'Evento', icon: CalendarRange },
  CAMPANA: { label: 'Campaña', icon: Megaphone },
};

const STATUS_META: Record<CampaignStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Activa',
    className:
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800',
  },
  UPCOMING: {
    label: 'Próxima',
    className:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  },
  ENDED: {
    label: 'Finalizada',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });

function formatDateRange(startDate: string, endDate: string) {
  return `${dateFormatter.format(new Date(startDate))} – ${dateFormatter.format(new Date(endDate))}`;
}

export function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  const { label: typeLabel, icon: TypeIcon } = TYPE_META[campaign.type];
  const statusMeta = STATUS_META[campaign.status];
  const hasMissions =
    campaign.missionsTotal !== undefined &&
    campaign.missionsTotal > 0 &&
    campaign.missionsCompleted !== undefined;
  const progressValue = hasMissions
    ? Math.round(
        ((campaign.missionsCompleted as number) / (campaign.missionsTotal as number)) * 100,
      )
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
              <TypeIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {typeLabel}
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
          <Progress value={progressValue} className="gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
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
