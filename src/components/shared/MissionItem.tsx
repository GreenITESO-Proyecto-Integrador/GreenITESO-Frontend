import { CheckCircle2, CircleDashed, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { PROGRESS_DARK_COLORS } from '@/lib/campaign-meta';
import { cn } from '@/lib/utils';
import type { Mission, UserMissionProgress } from '@/types/mission';

interface MissionItemProps {
  mission: Mission;
  userProgress?: UserMissionProgress;
  /** When set, shows a round button to log an action for this mission. */
  onLogAction?: (mission: Mission) => void;
}

export function MissionItem({ mission, userProgress, onLogAction }: MissionItemProps) {
  const isCompleted = userProgress?.completed ?? false;
  const progressValue = userProgress
    ? Math.min(100, Math.round((userProgress.currentCount / mission.targetCount) * 100))
    : null;

  return (
    <Card className="gap-0 rounded-xl bg-card py-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center gap-3 p-3">
        {onLogAction ? (
          <button
            type="button"
            aria-label="Registrar acción"
            onClick={() => onLogAction(mission)}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-500 text-white shadow-sm transition-colors hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
          >
            <Plus className="size-5" />
          </button>
        ) : null}

        <div
          className={
            isCompleted
              ? 'flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
              : 'flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
          }
        >
          {isCompleted ? <CheckCircle2 className="size-5" /> : <CircleDashed className="size-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            {mission.action.name}
          </p>
          <p className="text-xs text-muted-foreground">Meta: {mission.targetCount} veces</p>

          {progressValue !== null ? (
            <Progress value={progressValue} className={cn('mt-2 gap-1', PROGRESS_DARK_COLORS)}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            +{mission.pointsReward} pts
          </Badge>
          {userProgress ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {userProgress.currentCount}/{mission.targetCount}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
