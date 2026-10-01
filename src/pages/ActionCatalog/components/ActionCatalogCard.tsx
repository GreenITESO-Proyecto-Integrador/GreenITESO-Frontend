import { Camera, Droplets, Leaf, Recycle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatalogAction } from '@/types/action-catalog';

interface ActionCatalogCardProps {
  action: CatalogAction;
}

/**
 * Pick a Lucide icon from catalog category metadata.
 */
function categoryIcon(iconName: string) {
  const normalized = iconName.trim().toLowerCase();
  if (normalized.includes('drop') || normalized.includes('water')) {
    return Droplets;
  }
  if (normalized.includes('recycl')) {
    return Recycle;
  }
  if (normalized.includes('camera') || normalized.includes('photo')) {
    return Camera;
  }
  return Leaf;
}

/**
 * Card for one catalog action, including points, validation, and impact factors.
 */
export function ActionCatalogCard({ action }: ActionCatalogCardProps) {
  const Icon = categoryIcon(action.category.icon || action.category.code);
  const requiresPhoto = action.validationType === 'PHOTO';

  return (
    <Card className="rounded-2xl bg-card py-0 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md">
      <CardHeader className="gap-3 p-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-6" />
            </div>
            <div className="min-w-0">
              {action.category.name ? (
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {action.category.name}
                </p>
              ) : null}
              <CardTitle className="text-lg font-semibold text-foreground">{action.name}</CardTitle>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground tabular-nums">
            {action.points} pts
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground sm:text-base">{action.description}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          {requiresPhoto ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wider text-foreground">
              FOTO
            </span>
          ) : (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wider text-accent-foreground">
              SIN EVIDENCIA
            </span>
          )}
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wider text-muted-foreground">
            Límite {action.dailyLimit}/día
          </span>
        </div>
        {action.co2KgFactor > 0 || action.waterLitersFactor > 0 || action.plasticKgFactor > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {action.co2KgFactor > 0 ? (
              <div className="rounded-xl border border-border bg-accent px-2 py-2 text-center">
                <Leaf className="mx-auto mb-1 size-4 text-accent-foreground" />
                <p className="text-xs font-bold text-accent-foreground tabular-nums">
                  {action.co2KgFactor} kg
                </p>
                <p className="text-xs text-muted-foreground">CO₂</p>
              </div>
            ) : null}
            {action.waterLitersFactor > 0 ? (
              <div className="rounded-xl border border-border bg-muted px-2 py-2 text-center">
                <Droplets className="mx-auto mb-1 size-4 text-foreground" />
                <p className="text-xs font-bold text-foreground tabular-nums">
                  {action.waterLitersFactor} L
                </p>
                <p className="text-xs text-muted-foreground">Agua</p>
              </div>
            ) : null}
            {action.plasticKgFactor > 0 ? (
              <div className="rounded-xl border border-border bg-muted px-2 py-2 text-center">
                <Recycle className="mx-auto mb-1 size-4 text-foreground" />
                <p className="text-xs font-bold text-foreground tabular-nums">
                  {action.plasticKgFactor} kg
                </p>
                <p className="text-xs text-muted-foreground">Plástico</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-4" />
            Impacto ambiental pendiente de calibrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
